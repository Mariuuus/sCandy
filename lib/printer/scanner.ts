// lib/printer/scanner.ts
import http from 'http';
import { XMLParser } from 'fast-xml-parser';
import type { ScanSource, ScannerCapabilities, ScanSourceCaps } from '@/types/printer';

const parser = new XMLParser({ ignoreAttributes: true });

// ── HTTP ─────────────────────────────────────────────────────────────────────

export interface PrinterResponse {
  headers: http.IncomingMessage['headers'];
  buffer: Buffer;
  statusCode: number;
}

export function printerRequest(options: http.RequestOptions, body?: string): Promise<PrinterResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: process.env.PRINTER_IP, ...options }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        headers: res.headers,
        buffer: Buffer.concat(chunks),
        statusCode: res.statusCode ?? 0,
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── ScannerCapabilities ──────────────────────────────────────────────────────
// Different HP models speak different eSCL versions and have different input
// sources (e.g. OfficeJet Pro 8022 has an ADF, ENVY 4520 only a platen).
// The printer rejects jobs with a version it doesn't know (409 Conflict), so we
// read what it supports instead of hardcoding per model.

function parseSourceCaps(caps: unknown): ScanSourceCaps | null {
  if (caps == null || typeof caps !== 'object') return null;
  const c = caps as Record<string, unknown>;
  return {
    maxWidth: Number(c['scan:MaxWidth']) || 2550,
    maxHeight: Number(c['scan:MaxHeight']) || 3508,
  };
}

export function parseScannerCapabilities(xml: string): ScannerCapabilities {
  const root = parser.parse(xml)['scan:ScannerCapabilities'];
  if (!root) throw new Error('Printer returned no eSCL ScannerCapabilities');

  const adf = root['scan:Adf'];
  const feeder = parseSourceCaps(adf?.['scan:AdfSimplexInputCaps']);

  return {
    version: String(root['pwg:Version'] ?? '2.0'),
    model: String(root['pwg:MakeAndModel'] ?? ''),
    platen: parseSourceCaps(root['scan:Platen']?.['scan:PlatenInputCaps']),
    feeder,
    feederDuplex: feeder != null && adf?.['scan:AdfDuplexInputCaps'] != null,
  };
}

const CACHE_MS = 5 * 60 * 1000;
let cached: { ip: string | undefined; at: number; caps: ScannerCapabilities } | null = null;

export async function getScannerCapabilities(): Promise<ScannerCapabilities> {
  const ip = process.env.PRINTER_IP;
  if (cached && cached.ip === ip && Date.now() - cached.at < CACHE_MS) return cached.caps;

  const res = await printerRequest({ path: '/eSCL/ScannerCapabilities', method: 'GET' });
  if (res.statusCode !== 200) throw new Error(`ScannerCapabilities returned ${res.statusCode}`);

  const caps = parseScannerCapabilities(res.buffer.toString('utf-8'));
  cached = { ip, at: Date.now(), caps };
  return caps;
}

export function sourceCaps(caps: ScannerCapabilities, source: ScanSource): ScanSourceCaps | null {
  return source === 'Feeder' ? caps.feeder : caps.platen;
}
