import { NextResponse } from "next/server";
import { parsePrinterStatus } from "@/lib/printer/parse";
import http from 'http';

const PRINTER = process.env.PRINTER_URL;

function fetchXml(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(`http://${process.env.PRINTER_IP}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

export async function GET() {
	console.log('PRINTER_IP:', process.env.PRINTER_IP);
  console.log('Fetching:', `http://${process.env.PRINTER_IP}/DevMgmt/ProductStatusDyn.xml`);
  if (!PRINTER)
    return NextResponse.json(
      {
        error: "The Administrator did not set the PRINTER_URL, cannot proceed",
      },
      { status: 500 },
    );

  try {
    const [statusXml, consumableXml, configXml] = await Promise.all([
      fetchXml("/DevMgmt/ProductStatusDyn.xml"),
      fetchXml("/DevMgmt/ConsumableConfigDyn.xml"),
      fetchXml("/DevMgmt/ProductConfigDyn.xml"),
    ]);

    const status = parsePrinterStatus(statusXml, consumableXml, configXml);

    return Response.json(status);
  } catch (err) {
    console.error("Printer status error:", err);
    return Response.json({ error: "Could not reach printer" }, { status: 503 });
  }
}
