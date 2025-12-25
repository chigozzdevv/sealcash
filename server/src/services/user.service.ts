import { UserModel, EscrowModel } from '@models/models';

export class UserService {
  async getByBtcAddress(btcAddress: string) {
    return UserModel.findOne({ 'addresses.bitcoin': btcAddress });
  }

  async updateAddresses(btcAddress: string, addresses: Record<string, string>) {
    const user = await UserModel.findOneAndUpdate(
      { 'addresses.bitcoin': btcAddress },
      { $set: { addresses: { ...addresses, bitcoin: btcAddress } }, updatedAt: new Date() },
      { new: true }
    );
    if (!user) throw new Error('User not found');
    return user;
  }

  async activatePendingInvites(btcAddress: string) {
    const result = await EscrowModel.updateMany(
      { sellerId: btcAddress, status: 'pendingInvite' },
      { $set: { status: 'pending', updatedAt: new Date() } }
    );
    return result.modifiedCount;
  }
}
