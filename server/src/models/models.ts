import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  publicKey: { type: String, required: true, unique: true },
  addresses: {
    ethereum: String,
    polygon: String,
    bnb: String,
    solana: String,
    sui: String,
    bitcoin: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const EscrowSchema = new mongoose.Schema({
  buyerId: { type: String, required: true },
  sellerId: { type: String, required: true },
  btcAmount: { type: String, required: true },
  
  assetType: { type: String, enum: ['token', 'nft'], required: true },
  chain: { type: String, enum: ['ethereum', 'polygon', 'bnb', 'solana', 'sui'], required: true },
  
  contractAddress: String,
  amount: String,
  
  collectionAddress: String,
  tokenId: String,
  
  senderAddress: { type: String, required: true },
  receiverAddress: { type: String, required: true },
  refundAddress: String,
  timeout: { type: Date, required: true },
  
  status: { 
    type: String, 
    enum: ['pendingInvite', 'pending', 'accepted', 'locked', 'completed', 'rejected', 'refunded', 'expired'], 
    default: 'pending' 
  },
  
  taprootAddress: String,
  utxoId: String,
  charmId: String,
  
  submittedTxHash: String,
  verifiedTransfer: {
    txHash: String,
    blockNumber: Number,
    timestamp: Number,
    verified: Boolean
  },
  zkProof: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model('User', UserSchema);
export const EscrowModel = mongoose.model('Escrow', EscrowSchema);
