import { Router } from 'express';
import { UserService } from '@services/user.service';
import { AuthService } from '@auth/auth.service';

const router = Router();
const userService = new UserService();
const auth = new AuthService();

router.get('/profile', auth.middleware(), async (req, res) => {
  try {
    const user = await userService.getByBtcAddress((req as any).user.btcAddress);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/addresses', auth.middleware(), async (req, res) => {
  try {
    const user = await userService.updateAddresses((req as any).user.btcAddress, req.body.addresses);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export { router as userRoutes };
