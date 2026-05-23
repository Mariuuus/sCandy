// app/api/upload/route.ts
import http from 'http';
import https from 'https';

const NC_HOST = process.env.NEXTCLOUD_HOST ?? 'localhost';
const NC_USER = process.env.NEXTCLOUD_USER!;
const NC_PASS = process.env.NEXTCLOUD_PASS!;
const NC_FOLDER = process.env.NEXTCLOUD_FOLDER ?? 'Scans';

const isHttps = !NC_HOST.includes('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(NC_HOST);
const client = isHttps ? https : http;

const auth = () => Buffer.from(`${NC_USER}:${NC_PASS}`).toString('base64');

function davRequest(
  method: string,
  path: string,
  buffer?: Buffer,
  contentType?: string
): Promise<{ statusCode: number }> {
  const protocol = isHttps ? 'https' : 'http';
  console.log(`[Nextcloud] ${method} ${protocol}://${NC_HOST}${path}`);

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: NC_HOST,
        path,
        method,
        headers: {
          Authorization: `Basic ${auth()}`,
          ...(buffer && {
            'Content-Type': contentType ?? 'application/pdf',
            'Content-Length': buffer.length,
          }),
        },
      },
      (res) => {
        console.log(`[Nextcloud] ${method} ${path} → ${res.statusCode}`);
        res.resume();
        res.on('end', () => resolve({ statusCode: res.statusCode ?? 0 }));
      }
    );
    req.on('error', (err) => {
      console.error(`[Nextcloud] ${method} ${path} failed:`, err.message);
      reject(err);
    });
    if (buffer) req.write(buffer);
    req.end();
  });
}

function timeStampSuffix(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}_${mm}_${ss}`;
}

/** Check once, append HH_MM_SS if taken, throw if that also exists */
async function resolveFreePath(basePath: string, baseName: string): Promise<string> {
  const ext = '.pdf';
  const nameWithoutExt = baseName.replace(/\.pdf$/i, '');

  const primary = `${basePath}/${nameWithoutExt}${ext}`;
  const { statusCode: primaryStatus } = await davRequest('HEAD', primary);

  if (primaryStatus === 404) {
    console.log(`[Nextcloud] Filename is free: ${nameWithoutExt}${ext}`);
    return primary;
  }

  // File exists — append HH_MM_SS and check once more
  const fallback = `${basePath}/${nameWithoutExt}_${timeStampSuffix()}${ext}`;
  console.log(`[Nextcloud] Already exists, trying: ${fallback.split('/').pop()}`);

  const { statusCode: fallbackStatus } = await davRequest('HEAD', fallback);
  if (fallbackStatus === 404) return fallback;

  // Both taken — tell the user to rename
  throw new Error(
    `File "${nameWithoutExt}${ext}" and its timestamp variant already exist. Please rename and retry.`
  );
}

export async function POST(req: Request) {
  console.log('[Nextcloud] Upload request received');
  console.log(`[Nextcloud] Using host: ${NC_HOST} (${isHttps ? 'https' : 'http'})`);
  console.log(`[Nextcloud] Target folder: ${NC_FOLDER}`);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customName = formData.get('name') as string | null;

    if (!file) {
      console.error('[Nextcloud] No file provided in request');
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[Nextcloud] File size: ${file.size} bytes, type: ${file.type}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = customName
      ? customName.replace(/[^a-zA-Z0-9_\-. ]/g, '_')
      : `scan-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    console.log(`[Nextcloud] Base filename: ${baseName}`);

    const davBase = `/remote.php/dav/files/${NC_USER}/${NC_FOLDER}`;
    const freePath = await resolveFreePath(davBase, baseName);

    console.log(`[Nextcloud] Uploading to: ${freePath}`);

    const { statusCode } = await davRequest('PUT', freePath, buffer, 'application/pdf');

    if (statusCode === 201 || statusCode === 204) {
      const filename = freePath.split('/').pop();
      console.log(`[Nextcloud] ✓ Upload successful: ${filename}`);
      return Response.json({ success: true, filename });
    }

    console.error(`[Nextcloud] Unexpected status code: ${statusCode}`);
    return Response.json({ error: `Nextcloud returned ${statusCode}` }, { status: 502 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error(`[Nextcloud] ✗ ${message}`);
    // 409 for naming conflict so the frontend can show a specific message
    const status = message.includes('already exist') ? 409 : 503;
    return Response.json({ error: message }, { status });
  }
}