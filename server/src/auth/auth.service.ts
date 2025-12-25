import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import * as bitcoinMessage from 'bitcoinjs-message';
import { env } from '@config/env';

interface Challenge {
  challenge: string;
  expires: number;
}

export class AuthService {
  private secret = env.AUTH_SECRET;
  private challenges = new Map<string, Challenge>();

  generateChallenge(btcAddress: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const challenge = `sealcash:${timestamp}:${nonce}`;
    
    this.challenges.set(btcAddress, {
      challenge,
      expires: timestamp + 5 * 60 * 1000 // 5 min
    });

    return challenge;
  }

  verifySignature(btcAddress: string, signature: string): boolean {
    const stored = this.challenges.get(btcAddress);
    if (!stored) return false;
    if (Date.now() > stored.expires) {
      this.challenges.delete(btcAddress);
      return false;
    }

    try {
      const valid = bitcoinMessage.verify(stored.challenge, btcAddress, signature);
      this.challenges.delete(btcAddress);
      return valid;
    } catch {
      return false;
    }
  }

  generateToken(btcAddress: string): string {
    const payload = { btcAddress, ts: Date.now() };
    const data = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', this.secret).update(data).digest('hex');
    return Buffer.from(`${data}.${sig}`).toString('base64');
  }

  verifyToken(token: string): { btcAddress: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [data, sig] = decoded.split('.');
      const expected = crypto.createHmac('sha256', this.secret).update(data).digest('hex');
      if (sig !== expected) return null;

      const payload = JSON.parse(data);
      if (Date.now() - payload.ts > 24 * 60 * 60 * 1000) return null;

      return { btcAddress: payload.btcAddress };
    } catch {
      return null;
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token required' });
      }

      const user = this.verifyToken(auth.slice(7));
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      (req as any).user = user;
      next();
    };
  }
}
