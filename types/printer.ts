// types/printer.ts

export type PrinterStatusCategory = 'ready' | 'processing' | 'error' | 'offline' | string;

export interface PrinterAlert {
  id: string;
  severity: 'Info' | 'Warning' | 'Error';
  color?: 'Magenta' | 'Cyan' | 'Yellow' | 'Black';
  errorCode?: string;
}

export interface InkLevel {
  color: 'magenta' | 'cyan' | 'yellow' | 'black' | 'tricolor';
  label: string;           // M, C, Y, K, CMY
  percentRemaining: number;
  maxCapacityMl: number;   // converted from tenthsOfMilliliters
  cartridgeNumber: string; // e.g. "912XL"
  state: string;           // "ok", "nonHP", "low", etc.
  installedDate: string;
  rgb: [number, number, number];
}

export interface PrinterStatus {
  status: PrinterStatusCategory;
  isReady: boolean;
  alerts: PrinterAlert[];
  ink: InkLevel[];
  model: string;
  serialNumber: string;
  firmware: string;
  duplexInstalled: boolean;
  duplexEnabled: boolean;
  timestamp: string;
}

export type ScanSource = 'Platen' | 'Feeder';

export interface ScanSourceCaps {
  maxWidth: number;  // in 1/300 inch
  maxHeight: number; // in 1/300 inch
  resolutions: number[]; // supported DPI, ascending
}

export interface ScannerCapabilities {
  version: string;               // eSCL version the scanner speaks, e.g. "2.5"
  model: string;
  platen: ScanSourceCaps | null; // scanner glass ("Glas")
  feeder: ScanSourceCaps | null; // automatic document feeder ("Einzug")
  feederDuplex: boolean;
}
