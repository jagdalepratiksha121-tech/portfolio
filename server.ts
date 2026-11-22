import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const SUBMISSIONS_FILE = path.resolve(DATA_DIR, 'contact-submissions.json');

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isSafeWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function saveSubmission(entry: ContactSubmission): Promise<void> {
  if (!SUBMISSIONS_FILE.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid submission storage path');
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  let existing: ContactSubmission[] = [];
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      existing = parsed;
    }
  } catch {
    existing = [];
  }
  existing.unshift(entry);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(existing.slice(0, 250), null, 2), 'utf8');
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ ok: false, error: 'Please enter your name (2–120 characters).' });
      return;
    }
    if (!isValidEmail(email) || email.length > 180) {
      res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
      return;
    }
    if (subject.length < 2 || subject.length > 180) {
      res.status(400).json({ ok: false, error: 'Please enter a subject (2–180 characters).' });
      return;
    }
    if (message.length < 10 || message.length > 4000) {
      res.status(400).json({ ok: false, error: 'Please enter a message (10–4000 characters).' });
      return;
    }

    const entry: ContactSubmission = {
      id: crypto.randomUUID(),
      name,
      email,
      subject,
      message,
      receivedAt: new Date().toISOString(),
    };

    try {
      await saveSubmission(entry);

      let forwarded = false;
      const webhookUrl = process.env.CONTACT_WEBHOOK_URL?.trim();
      if (webhookUrl && isSafeWebhookUrl(webhookUrl)) {
        try {
          const webhookRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
            signal: AbortSignal.timeout(5000),
          });
          forwarded = webhookRes.ok;
        } catch {
          forwarded = false;
        }
      }

      res.status(201).json({
        ok: true,
        id: entry.id,
        receivedAt: entry.receivedAt,
        forwarded,
      });
    } catch {
      res.status(500).json({
        ok: false,
        error: 'Unable to record your message on the server right now. Please use the direct email link below.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
