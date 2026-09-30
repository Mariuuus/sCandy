// app/api/scanner-capabilities/route.ts
import { getScannerCapabilities } from '@/lib/printer/scanner';

export async function GET() {
  try {
    return Response.json(await getScannerCapabilities());
  } catch (err) {
    console.error('Scanner capabilities error:', err);
    return Response.json({ error: 'Could not read scanner capabilities' }, { status: 503 });
  }
}
