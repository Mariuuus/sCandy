// app/api/scan/route.ts
import http from 'http';

const PRINTER_IP = process.env.PRINTER_IP;

function httpRequest(options: http.RequestOptions, body?: string): Promise<{ 
  headers: http.IncomingMessage['headers'], 
  buffer: Buffer,
  statusCode: number 
}> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

function buildScanXml(source: 'Platen' | 'Feeder') {
  return `<?xml version="1.0" encoding="UTF-8"?><scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm"><pwg:Version>2.63</pwg:Version><scan:Intent>Document</scan:Intent><pwg:ScanRegions><pwg:ScanRegion><pwg:Height>3507</pwg:Height><pwg:Width>2481</pwg:Width><pwg:XOffset>0</pwg:XOffset><pwg:YOffset>0</pwg:YOffset></pwg:ScanRegion></pwg:ScanRegions><pwg:InputSource>${source === 'Feeder' ? 'Feeder' : 'Platen'}</pwg:InputSource><scan:DocumentFormatExt>application/pdf</scan:DocumentFormatExt><scan:XResolution>300</scan:XResolution><scan:YResolution>300</scan:YResolution><scan:ColorMode>RGB24</scan:ColorMode><scan:CompressionFactor>25</scan:CompressionFactor><scan:Brightness>1000</scan:Brightness><scan:Contrast>1000</scan:Contrast></scan:ScanSettings>`;
}

export async function POST(req: Request) {
  try {
    const { source = 'Platen' } = await req.json() as { source?: 'Platen' | 'Feeder' };

    if (source !== 'Platen' && source !== 'Feeder') {
      return Response.json({ error: 'Invalid source. Use "Platen" or "Feeder"' }, { status: 400 });
    }

    const body = buildScanXml(source);

    // 1. Create scan job
    const job = await httpRequest({
      hostname: PRINTER_IP,
      path: '/eSCL/ScanJobs',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    // temporarily add this after the job request:
    console.log('Job response body:', job.buffer.toString('utf-8'));
    console.log('Status code:', job.statusCode); // need to add this too

    const location = job.headers['location'];
    if (!location) {
      return Response.json({ error: 'Printer did not return a job location' }, { status: 502 });
    }

    // location may be a full URL or just a path
    const jobPath = location.startsWith('http')
      ? new URL(location).pathname
      : location;

    // 2. Download the scanned PDF
    const pdf = await httpRequest({
      hostname: PRINTER_IP,
      path: `${jobPath}/NextDocument`,
      method: 'GET',
    });

    // 3. Clean up the job
    httpRequest({
      hostname: PRINTER_IP,
      path: jobPath,
      method: 'DELETE',
    }).catch(() => {}); // fire and forget

    return new Response(pdf.buffer.buffer as ArrayBuffer, {
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