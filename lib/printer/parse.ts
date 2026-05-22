// lib/printer/parse.ts
import { XMLParser } from 'fast-xml-parser';
import type { PrinterStatus, InkLevel, PrinterAlert } from '@/types/printer';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    ['psdyn:Status', 'psdyn:Alert', 'ccdyn:ConsumableInfo'].includes(name),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(obj: unknown, ...keys: string[]): unknown {
  let current = obj as Record<string, unknown>;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key] as Record<string, unknown>;
  }
  return current;
}

function str(obj: unknown, ...keys: string[]): string {
  const val = getNestedValue(obj, ...keys);
  return val != null ? String(val) : '';
}

function num(obj: unknown, ...keys: string[]): number {
  return Number(getNestedValue(obj, ...keys)) || 0;
}

// ── ProductStatusDyn ─────────────────────────────────────────────────────────

function parseStatusXml(xml: string): {
  status: string;
  isReady: boolean;
  alerts: PrinterAlert[];
} {
  const doc = parser.parse(xml);
  const root = doc['psdyn:ProductStatusDyn'];

  const statuses: unknown[] = root['psdyn:Status'] ?? [];
  const isReady = statuses.some(
    (s) => str(s, 'pscat:StatusCategory') === 'ready'
  );
  const primaryStatus = str(statuses[0], 'pscat:StatusCategory') || 'unknown';

  const alertTable = root['psdyn:AlertTable'];
  const rawAlerts: unknown[] = alertTable?.['psdyn:Alert'] ?? [];

  const alerts: PrinterAlert[] = rawAlerts.map((a) => ({
    id: str(a, 'ad:ProductStatusAlertID'),
    severity: (str(a, 'ad:Severity') as PrinterAlert['severity']) || 'Info',
    color: str(a, 'ad:AlertDetails', 'ad:AlertDetailsMarkerColor') as PrinterAlert['color'],
    errorCode: str(a, 'ad:AlertDetails', 'ad:AlertDetailsErrorCode'),
  }));

  return { status: primaryStatus, isReady, alerts };
}

// ── ConsumableConfigDyn ──────────────────────────────────────────────────────

const COLOR_MAP: Record<string, InkLevel['color']> = {
  M: 'magenta',
  C: 'cyan',
  Y: 'yellow',
  K: 'black',
};

function parseConsumableXml(xml: string): InkLevel[] {
  const doc = parser.parse(xml);
  const root = doc['ccdyn:ConsumableConfigDyn'];
  const consumables: unknown[] = root['ccdyn:ConsumableInfo'] ?? [];

  return consumables
    .filter((c) => str(c, 'dd:ConsumableTypeEnum') === 'ink')
    .map((c) => {
      const labelCode = str(c, 'dd:ConsumableLabelCode'); // M, C, Y, K
      const maxRaw = num(c, 'dd:Capacity', 'dd:MaxCapacity');

      const iconR = num(c, 'dd:ConsumableIcon', 'dd:FillColor', 'dd:Red');
      const iconG = num(c, 'dd:ConsumableIcon', 'dd:FillColor', 'dd:Green');
      const iconB = num(c, 'dd:ConsumableIcon', 'dd:FillColor', 'dd:Blue');

      return {
        color: COLOR_MAP[labelCode] ?? 'black',
        label: labelCode,
        percentRemaining: num(c, 'dd:ConsumablePercentageLevelRemaining'),
        maxCapacityMl: maxRaw / 10,
        cartridgeNumber: str(c, 'dd:ConsumableSelectibilityNumber'),
        state: str(c, 'dd:ConsumableLifeState', 'dd:ConsumableState'),
        installedDate: str(c, 'dd:Installation', 'dd:Date'),
        rgb: [iconR, iconG, iconB] as [number, number, number],
      };
    });
}

// ── ProductConfigDyn ─────────────────────────────────────────────────────────

function parseConfigXml(xml: string): {
  model: string;
  serialNumber: string;
  firmware: string;
  duplexInstalled: boolean;
  duplexEnabled: boolean;
  timestamp: string;
} {
  const doc = parser.parse(xml);
  const root = doc['prdcfgdyn2:ProductConfigDyn'];
  const info = root['prdcfgdyn:ProductInformation'];
  const settings = root['prdcfgdyn2:ProductSettings'];

  return {
    model: str(info, 'dd:MakeAndModel'),
    serialNumber: str(info, 'dd:SerialNumber'),
    firmware: str(info, 'dd:Version', 'dd:Revision'),
    duplexInstalled: str(info, 'dd:DuplexUnit') === 'Installed',
    duplexEnabled: str(settings, 'dd:Duplex') === 'enabled',
    timestamp: str(settings, 'dd:TimeStamp'),
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parsePrinterStatus(
  statusXml: string,
  consumableXml: string,
  configXml: string
): PrinterStatus {
  const { status, isReady, alerts } = parseStatusXml(statusXml);
  const ink = parseConsumableXml(consumableXml);
  const config = parseConfigXml(configXml);

  return {
    status,
    isReady,
    alerts,
    ink,
    ...config,
  };
}