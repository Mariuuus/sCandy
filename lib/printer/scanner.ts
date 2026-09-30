// lib/printer/scanner.ts
import http from 'http';
import { XMLParser } from 'fast-xml-parser';
import type { ScanSource, ScannerCapabilities, ScanSourceCaps } from '@/types/printer';

const parser = new XMLParser({
  ignoreAttributes: true,
  isArray: (name) => ['scan:SettingProfile', 'scan:DiscreteResolution'].includes(name),
});

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

const COMMON_RESOLUTIONS = [75, 100, 150, 200, 300, 600, 1200];

// Scanners list resolutions either as discrete values or as a range. Only
// square resolutions (X == Y) are offered, since that is what users expect.
function parseResolutions(input: Record<string, unknown>): number[] {
  const found = new Set<number>();
  const profiles = (input['scan:SettingProfiles'] as Record<string, unknown> | undefined)?.['scan:SettingProfile'] as unknown[] ?? [];

  for (const profile of profiles) {
    const supported = (profile as Record<string, Record<string, unknown>>)?.['scan:SupportedResolutions'];
    if (!supported) continue;

    const discrete = (supported['scan:DiscreteResolutions'] as Record<string, unknown> | undefined)?.['scan:DiscreteResolution'] as Record<string, unknown>[] ?? [];
    for (const r of discrete) {
      const x = Number(r['scan:XResolution']);
      if (x > 0 && x === Number(r['scan:YResolution'])) found.add(x);
    }

    const range = supported['scan:ResolutionRange'] as Record<string, Record<string, unknown>> | undefined;
    if (range) {
      const min = Math.max(Number(range['scan:XResolutionRange']?.['scan:Min']), Number(range['scan:YResolutionRange']?.['scan:Min']));
      const max = Math.min(Number(range['scan:XResolutionRange']?.['scan:Max']), Number(range['scan:YResolutionRange']?.['scan:Max']));
      COMMON_RESOLUTIONS.filter((r) => r >= min && r <= max).forEach((r) => found.add(r));
    }
  }

  return [...found].sort((a, b) => a - b);
}

function parseSourceCaps(caps: unknown): ScanSourceCaps | null {
  if (caps == null || typeof caps !== 'object') return null;
  const c = caps as Record<string, unknown>;
  const resolutions = parseResolutions(c);
  return {
    maxWidth: Number(c['scan:MaxWidth']) || 2550,
    maxHeight: Number(c['scan:MaxHeight']) || 3508,
    // every eSCL scanner supports 300 dpi, fall back to it if none were listed
    resolutions: resolutions.length ? resolutions : [300],
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
