import { EscrowModel, UserModel } from '@models/models';
import { CharmsService, EscrowCharm } from '@services/charms.service';
import { BlockchainService, ChainType } from '@services/blockchain.service';
import { env } from '@config/env';

export interface CreateEscrowRequest {
  sellerBtcAddress: string;
  btcAmount: string;
  assetType: 'token' | 'nft';
  chain: ChainType;
  contractAddress?: string;
  amount?: string;
  tokenId?: string;
  senderAddress: string;
  receiverAddress: string;
  timeout: Date;
}

export interface LockBtcRequest {
  fundingUtxo: string;
  fundingValue: number;
  prevTxHex: string;
  outputAddress: string;
  changeAddress: string;
}

export interface ReleaseRequest {
  fundingUtxo: string;
  fundingValue: number;
  prevTxHex: string;
  changeAddress: string;
}

export class EscrowService {
  private charms: CharmsService;
  private blockchain: BlockchainService;
  private signerKey = env.ATTESTATION_KEY;

  constructor() {
    this.charms = new CharmsService();
    this.blockchain = new BlockchainService();
  }

  async createEscrow(buyerBtcAddress: string, data: CreateEscrowRequest) {
    const buyer = await UserModel.findOne({ 'addresses.bitcoin': buyerBtcAddress });
    if (!buyer) throw new Error('Buyer must be registered');

    const seller = await UserModel.findOne({ 'addresses.bitcoin': data.sellerBtcAddress });
    const sellerRegistered = !!seller;

    const escrow = new EscrowModel({
      buyerId: buyerBtcAddress,
      sellerId: data.sellerBtcAddress,
      ...data,
      status: sellerRegistered ? 'pending' : 'pendingInvite'
    });
    await escrow.save();

    return {
      escrow,
      sellerRegistered,
      inviteLink: sellerRegistered ? null : `/invite/${escrow._id}`
    };
  }

  async acceptEscrow(escrowId: string, sellerBtcAddress: string) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow) throw new Error('Escrow not found');
    if (escrow.sellerId !== sellerBtcAddress) throw new Error('Not authorized');
    if (escrow.status !== 'pending') throw new Error('Escrow not pending');
    if (new Date() > escrow.timeout) throw new Error('Escrow expired');

    escrow.status = 'accepted';
    escrow.updatedAt = new Date();
    await escrow.save();
    return escrow;
  }

  async rejectEscrow(escrowId: string, sellerBtcAddress: string) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow) throw new Error('Escrow not found');
    if (escrow.sellerId !== sellerBtcAddress) throw new Error('Not authorized');
    if (escrow.status !== 'pending') throw new Error('Escrow not pending');

    escrow.status = 'rejected';
    escrow.updatedAt = new Date();
    await escrow.save();
    return escrow;
  }

  async lockBtc(escrowId: string, buyerBtcAddress: string, btcData: LockBtcRequest) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.buyerId !== buyerBtcAddress) throw new Error('Invalid escrow');
    if (escrow.status !== 'accepted') throw new Error('Escrow not accepted by seller');
    if (new Date() > escrow.timeout) throw new Error('Escrow expired');

    const charm = this.buildCharm(escrow);

    const { commitTx, spellTx } = await this.charms.createLockSpell(
      escrowId,
      charm,
      btcData.fundingUtxo,
      btcData.fundingValue,
      btcData.prevTxHex,
      btcData.outputAddress,
      btcData.changeAddress
    );

    escrow.status = 'locked';
    escrow.taprootAddress = btcData.outputAddress;
    escrow.utxoId = `${commitTx.slice(0, 64)}:0`;
    escrow.updatedAt = new Date();
    await escrow.save();

    return { escrow, commitTx, spellTx };
  }

  async submitProof(escrowId: string, sellerBtcAddress: string, txHash: string) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.sellerId !== sellerBtcAddress || escrow.status !== 'accepted') {
      throw new Error('Invalid escrow');
    }
    if (new Date() > escrow.timeout) throw new Error('Expired');

    const verified = escrow.assetType === 'token'
      ? await this.blockchain.verifyTokenTransfer(escrow.chain, txHash, escrow.senderAddress, escrow.receiverAddress, escrow.amount!, escrow.contractAddress || undefined)
      : await this.blockchain.verifyNFTTransfer(escrow.chain, txHash, escrow.senderAddress, escrow.receiverAddress, escrow.tokenId!, escrow.contractAddress || '');

    if (!verified) throw new Error('Transfer verification failed');

    escrow.submittedTxHash = txHash;
    escrow.verifiedTransfer = { txHash, blockNumber: verified.blockNumber, timestamp: verified.timestamp, verified: true };
    await escrow.save();

    return escrow;
  }

  async releaseBtc(escrowId: string, sellerBtcAddress: string, btcData: ReleaseRequest) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.sellerId !== sellerBtcAddress || !escrow.verifiedTransfer?.verified) {
      throw new Error('Invalid escrow or not verified');
    }

    const seller = await UserModel.findOne({ 'addresses.bitcoin': sellerBtcAddress });
    if (!seller?.addresses?.bitcoin) throw new Error('Seller has no BTC address');

    const charm = this.buildCharm(escrow);
    const attestation = this.charms.generateAttestation(escrowId, escrow.submittedTxHash!, this.signerKey);

    const { commitTx, spellTx } = await this.charms.createReleaseSpell(
      escrowId,
      escrow.utxoId!,
      charm,
      attestation,
      btcData.prevTxHex,
      seller.addresses.bitcoin,
      btcData.fundingUtxo,
      btcData.fundingValue,
      btcData.changeAddress
    );

    escrow.status = 'completed';
    escrow.zkProof = JSON.stringify(attestation);
    escrow.updatedAt = new Date();
    await escrow.save();

    return { escrow, commitTx, spellTx };
  }

  async refundBtc(escrowId: string, buyerBtcAddress: string, btcData: ReleaseRequest & { currentBlock: number }) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.buyerId !== buyerBtcAddress) throw new Error('Invalid escrow');
    if (new Date() < escrow.timeout) throw new Error('Not expired yet');

    const buyer = await UserModel.findOne({ 'addresses.bitcoin': buyerBtcAddress });
    if (!buyer?.addresses?.bitcoin) throw new Error('Buyer has no BTC address');

    const charm = this.buildCharm(escrow);

    const { commitTx, spellTx } = await this.charms.createRefundSpell(
      escrowId,
      escrow.utxoId!,
      charm,
      btcData.currentBlock,
      btcData.prevTxHex,
      buyer.addresses.bitcoin,
      btcData.fundingUtxo,
      btcData.fundingValue,
      btcData.changeAddress
    );

    escrow.status = 'refunded';
    escrow.updatedAt = new Date();
    await escrow.save();

    return { escrow, commitTx, spellTx };
  }

  async getEscrow(id: string) {
    return EscrowModel.findById(id);
  }

  async getUserEscrows(btcAddress: string, role?: 'buyer' | 'seller', status?: string) {
    const query: any = { $or: [{ buyerId: btcAddress }, { sellerId: btcAddress }] };
    if (role === 'buyer') query.$or = [{ buyerId: btcAddress }];
    if (role === 'seller') query.$or = [{ sellerId: btcAddress }];
    if (status) query.status = status;
    return EscrowModel.find(query).sort({ createdAt: -1 });
  }

  async getPendingInvites(btcAddress: string) {
    return EscrowModel.find({ sellerId: btcAddress, status: 'pending' }).sort({ createdAt: -1 });
  }

  private buildCharm(escrow: any): EscrowCharm {
    return {
      state: 'Locked',
      amount: Math.floor(parseFloat(escrow.btcAmount) * 1e8),
      buyer: escrow.buyerId,
      seller: escrow.sellerId,
      timeout: Math.floor(new Date(escrow.timeout).getTime() / 1000),
      asset_request: {
        chain: escrow.chain,
        contract: escrow.contractAddress || '',
        amount: escrow.amount || escrow.tokenId || '',
        receiver: escrow.receiverAddress
      }
    };
  }
}
