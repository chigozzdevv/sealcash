import { Router } from 'express';
import { EscrowService } from '@services/escrow.service';
import { AuthService } from '@auth/auth.service';

const router = Router();
const escrow = new EscrowService();
const auth = new AuthService();

router.use(auth.middleware());

router.post('/create', async (req, res) => {
  try {
    const result = await escrow.createEscrow((req as any).user.btcAddress, req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/accept', async (req, res) => {
  try {
    const result = await escrow.acceptEscrow(req.params.id, (req as any).user.btcAddress);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const result = await escrow.rejectEscrow(req.params.id, (req as any).user.btcAddress);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/lock', async (req, res) => {
  try {
    const result = await escrow.lockBtc(req.params.id, (req as any).user.btcAddress, req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/submit-proof', async (req, res) => {
  try {
    const result = await escrow.submitProof(req.params.id, (req as any).user.btcAddress, req.body.txHash);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/release', async (req, res) => {
  try {
    const result = await escrow.releaseBtc(req.params.id, (req as any).user.btcAddress, req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/refund', async (req, res) => {
  try {
    const result = await escrow.refundBtc(req.params.id, (req as any).user.btcAddress, req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/pending-invites', async (req, res) => {
  try {
    const result = await escrow.getPendingInvites((req as any).user.btcAddress);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await escrow.getEscrow(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;
    const result = await escrow.getUserEscrows(
      (req as any).user.btcAddress,
      role as 'buyer' | 'seller' | undefined,
      status as string | undefined
    );
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export { router as escrowRoutes };
