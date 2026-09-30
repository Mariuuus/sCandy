// app/api/scan/route.ts
import { getScannerCapabilities, printerRequest, sourceCaps } from '@/lib/printer/scanner';
import type { ScanSource, ScanSourceCaps } from '@/types/printer';

// A4 at 300 dpi, in 1/300 inch
const A4_WIDTH = 2481;
const A4_HEIGHT = 3507;

function buildScanXml(source: ScanSource, version: string, caps: ScanSourceCaps) {
  const width = Math.min(A4_WIDTH, caps.maxWidth);
  const height = Math.min(A4_HEIGHT, caps.maxHeight);
  return `<?xml version="1.0" encoding="UTF-8"?><scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm"><pwg:Version>${version}</pwg:Version><scan:Intent>Document</scan:Intent><pwg:ScanRegions><pwg:ScanRegion><pwg:Height>${height}</pwg:Height><pwg:Width>${width}</pwg:Width><pwg:XOffset>0</pwg:XOffset><pwg:YOffset>0</pwg:YOffset></pwg:ScanRegion></pwg:ScanRegions><pwg:InputSource>${source}</pwg:InputSource><scan:DocumentFormatExt>application/pdf</scan:DocumentFormatExt><scan:XResolution>300</scan:XResolution><scan:YResolution>300</scan:YResolution><scan:ColorMode>RGB24</scan:ColorMode><scan:CompressionFactor>25</scan:CompressionFactor><scan:Brightness>1000</scan:Brightness><scan:Contrast>1000</scan:Contrast></scan:ScanSettings>`;
}

// The scanner answers 503 while it is still busy (e.g. the head returning
// from a previous scan), so retry for a little while before giving up.
async function createJob(body: string) {
  for (let attempt = 0; ; attempt++) {
    const job = await printerRequest({
      path: '/eSCL/ScanJobs',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);
    if (job.statusCode !== 503 || attempt >= 10) return job;
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function POST(req: Request) {
  try {
    const { source = 'Platen' } = await req.json() as { source?: ScanSource };

    if (source !== 'Platen' && source !== 'Feeder') {
      return Response.json({ error: 'Invalid source. Use "Platen" or "Feeder"' }, { status: 400 });
    }

    const caps = await getScannerCapabilities();
    const inputCaps = sourceCaps(caps, source);
    if (!inputCaps) {
      const name = source === 'Feeder' ? 'document feeder ("Einzug")' : 'scanner glass';
      return Response.json({ error: `${caps.model || 'This printer'} has no ${name}` }, { status: 400 });
    }

    const body = buildScanXml(source, caps.version, inputCaps);

    // 1. Create scan job
    const job = await createJob(body);

    const location = job.headers['location'];
    if (!location) {
      console.error('Scan job rejected:', job.statusCode, job.buffer.toString('utf-8'));
      const error = job.statusCode === 503
        ? 'Scanner is busy, try again in a moment'
        : `Printer rejected the scan job (HTTP ${job.statusCode})`;
      return Response.json({ error }, { status: 502 });
    }

    // location may be a full URL or just a path
    const jobPath = location.startsWith('http')
      ? new URL(location).pathname
      : location;

    // 2. Download the scanned PDF
    const pdf = await printerRequest({
      path: `${jobPath}/NextDocument`,
      method: 'GET',
    });

    // 3. Clean up the job
    printerRequest({
      path: jobPath,
      method: 'DELETE',
    }).catch(() => {}); // fire and forget

    if (pdf.statusCode !== 200) {
      console.error('Scan download failed:', pdf.statusCode);
      return Response.json({ error: `Could not download scan (HTTP ${pdf.statusCode})` }, { status: 502 });
    }

    return new Response(new Uint8Array(pdf.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="scan-${Date.now()}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Scan error:', err);
    return Response.json({ error: 'Scan failed' }, { status: 503 });
  }
}
