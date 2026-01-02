import { EscrowModel, UserModel } from '@models/models';
import { CharmsService, EscrowCharm } from '@services/charms.service';
import { BlockchainService, ChainType } from '@services/blockchain.service';
import { BitcoinService } from '@services/bitcoin.service';
import { env } from '@config/env';

export interface CreateEscrowRequest {
  sellerBtcAddress: string;
  btcAmount: string;
  assetType: 'token' | 'nft';
  chain: ChainType;
  contractAddress?: string;
  amount?: string;
  collectionAddress?: string;
  tokenId?: string;
  senderAddress: string;
  receiverAddress: string;
  refundAddress?: string;
  timeout: string;
}

export interface LockRequest {
  fundingUtxo: string;
  fundingValue: number;
  prevTxHex: string;
  outputAddress: string;
  changeAddress: string;
  broadcast?: boolean;
}

export interface ReleaseRequest {
  fundingUtxo: string;
  fundingValue: number;
  prevTxHex: string;
  changeAddress: string;
  broadcast?: boolean;
}

export class EscrowService {
  private charms: CharmsService;
  private blockchain: BlockchainService;
  private bitcoin: BitcoinService;
  private signerKey = env.ATTESTATION_KEY;

  constructor() {
    this.charms = new CharmsService();
    this.blockchain = new BlockchainService();
    this.bitcoin = new BitcoinService();
  }

  async createEscrow(buyerBtcAddress: string, data: CreateEscrowRequest) {
    if (buyerBtcAddress === data.sellerBtcAddress) {
      throw new Error('Buyer and seller cannot be the same');
    }

    const buyer = await UserModel.findOne({ 'addresses.bitcoin': buyerBtcAddress });
    if (!buyer) throw new Error('Buyer not registered');

    const seller = await UserModel.findOne({ 'addresses.bitcoin': data.sellerBtcAddress });
    if (!seller) throw new Error('Seller not found');

    const escrow = new EscrowModel({
      buyerId: buyerBtcAddress,
      sellerId: data.sellerBtcAddress,
      btcAmount: data.btcAmount,
      assetType: data.assetType,
      chain: data.chain,
      contractAddress: data.contractAddress,
      amount: data.amount,
      collectionAddress: data.collectionAddress,
      tokenId: data.tokenId,
      senderAddress: data.senderAddress,
      receiverAddress: data.receiverAddress,
      refundAddress: data.refundAddress || buyerBtcAddress,
      timeout: new Date(data.timeout),
      status: 'pending'
    });

    await escrow.save();
    return escrow;
  }

  async acceptEscrow(escrowId: string, sellerBtcAddress: string) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.sellerId !== sellerBtcAddress) throw new Error('Invalid escrow');
    if (escrow.status !== 'pending') throw new Error('Escrow not pending');
    if (new Date() > escrow.timeout) throw new Error('Escrow expired');

    escrow.status = 'accepted';
    escrow.updatedAt = new Date();
    await escrow.save();
    return escrow;
  }

  async rejectEscrow(escrowId: string, sellerBtcAddress: string) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.sellerId !== sellerBtcAddress) throw new Error('Invalid escrow');
    if (escrow.status !== 'pending') throw new Error('Escrow not pending');

    escrow.status = 'rejected';
    escrow.updatedAt = new Date();
    await escrow.save();
    return escrow;
  }

  async lockBtc(escrowId: string, buyerBtcAddress: string, btcData: LockRequest) {
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

    let broadcastResult = null;
    if (btcData.broadcast) {
      broadcastResult = await this.bitcoin.broadcastSpellPackage(commitTx, spellTx);
    }

    escrow.status = 'locked';
    escrow.utxoId = `${broadcastResult?.commitTxId || 'pending'}:0`;
    escrow.updatedAt = new Date();
    await escrow.save();

    return {
      escrow,
      commitTx,
      spellTx,
      broadcast: broadcastResult
    };
  }

  async submitProof(escrowId: string, sellerBtcAddress: string, txHash: string) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.sellerId !== sellerBtcAddress) throw new Error('Invalid escrow');
    if (escrow.status !== 'locked') throw new Error('BTC not locked yet');

    let verified = false;
    let verificationData = null;

    try {
      if (escrow.assetType === 'token') {
        verificationData = await this.blockchain.verifyTokenTransfer(
          escrow.chain as ChainType,
          txHash,
          escrow.senderAddress,
          escrow.receiverAddress,
          escrow.amount!,
          escrow.contractAddress
        );
      } else {
        verificationData = await this.blockchain.verifyNFTTransfer(
          escrow.chain as ChainType,
          txHash,
          escrow.senderAddress,
          escrow.receiverAddress,
          escrow.tokenId!,
          escrow.collectionAddress!
        );
      }
      verified = !!verificationData;
    } catch (error) {
      console.error('Verification failed:', error);
    }

    escrow.submittedTxHash = txHash;
    escrow.verifiedTransfer = {
      txHash,
      blockNumber: verificationData?.blockNumber || 0,
      timestamp: verificationData?.timestamp || Math.floor(Date.now() / 1000),
      verified
    };
    escrow.updatedAt = new Date();
    await escrow.save();

    return { escrow, verified };
  }

  async releaseBtc(escrowId: string, sellerBtcAddress: string, btcData: ReleaseRequest) {
    const escrow = await EscrowModel.findById(escrowId);
    if (!escrow || escrow.sellerId !== sellerBtcAddress) throw new Error('Invalid escrow');
    if (!escrow.verifiedTransfer?.verified) throw new Error('Transfer not verified');

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

    let broadcastResult = null;
    if (btcData.broadcast) {
      broadcastResult = await this.bitcoin.broadcastSpellPackage(commitTx, spellTx);
    }

    escrow.status = 'completed';
    escrow.zkProof = JSON.stringify(attestation);
    escrow.updatedAt = new Date();
    await escrow.save();

    return {
      escrow,
      commitTx,
      spellTx,
      broadcast: broadcastResult
    };
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

    let broadcastResult = null;
    if (btcData.broadcast) {
      broadcastResult = await this.bitcoin.broadcastSpellPackage(commitTx, spellTx);
    }

    escrow.status = 'refunded';
    escrow.updatedAt = new Date();
    await escrow.save();

    return {
      escrow,
      commitTx,
      spellTx,
      broadcast: broadcastResult
    };
  }

  async getEscrow(escrowId: string) {
    return EscrowModel.findById(escrowId);
  }

  async getUserEscrows(btcAddress: string, role?: 'buyer' | 'seller', status?: string) {
    const query: any = {
      $or: [
        { buyerId: btcAddress },
        { sellerId: btcAddress }
      ]
    };

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
