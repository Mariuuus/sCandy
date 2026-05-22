// types/printer.ts

export type PrinterStatusCategory = 'ready' | 'processing' | 'error' | 'offline' | string;

export interface PrinterAlert {
  id: string;
  severity: 'Info' | 'Warning' | 'Error';
  color?: 'Magenta' | 'Cyan' | 'Yellow' | 'Black';
  errorCode?: string;
}

export interface InkLevel {
  color: 'magenta' | 'cyan' | 'yellow' | 'black';
  label: string;           // M, C, Y, K
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