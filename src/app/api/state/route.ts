import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { AppStoreState } from '@/types/job';

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export async function GET() {
  const personalApiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as AppStoreState;
    return NextResponse.json({
      exists: true,
      storageMode: 'local-file',
      personalApiConfigured,
      state: parsed,
    });
  } catch {
    return NextResponse.json({
      exists: false,
      storageMode: process.env.VERCEL ? 'browser-only' : 'local-file',
      personalApiConfigured,
      state: null,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AppStoreState;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({
      saved: true,
      storageMode: 'local-file',
    });
  } catch {
    // Graceful no-op on Vercel read-only serverless filesystem; client keeps localStorage synced
    return NextResponse.json({
      saved: false,
      storageMode: 'browser-only',
    });
  }
}
