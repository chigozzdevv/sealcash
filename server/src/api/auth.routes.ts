import { Router } from 'express';
import { AuthService } from '@auth/auth.service';
import { UserModel } from '@models/models';
import { UserService } from '@services/user.service';

const router = Router();
const auth = new AuthService();
const userService = new UserService();

router.get('/challenge', (req, res) => {
  const { btcAddress } = req.query;
  if (!btcAddress || typeof btcAddress !== 'string') {
    return res.status(400).json({ error: 'btcAddress required' });
  }
  res.json({ challenge: auth.generateChallenge(btcAddress) });
});

router.post('/verify', async (req, res) => {
  try {
    const { btcAddress, signature } = req.body;
    if (!btcAddress || !signature) {
      return res.status(400).json({ error: 'btcAddress and signature required' });
    }

    if (!auth.verifySignature(btcAddress, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let user = await UserModel.findOne({ 'addresses.bitcoin': btcAddress });
    let isNewUser = false;
    if (!user) {
      user = new UserModel({ publicKey: btcAddress, addresses: { bitcoin: btcAddress } });
      await user.save();
      isNewUser = true;
    }

    const activatedInvites = await userService.activatePendingInvites(btcAddress);
    const token = auth.generateToken(btcAddress);
    res.json({ token, user, isNewUser, activatedInvites });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export { router as authRoutes };
