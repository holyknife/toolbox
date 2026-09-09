export type QrType = 'text' | 'wifi' | 'contact' | 'email' | 'phone';
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface WifiInput {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden?: boolean;
}

export type QrInput =
  | { type: 'text'; text: string }
  | ({ type: 'wifi' } & WifiInput)
  | { type: 'contact'; name: string; phone: string; email: string }
  | { type: 'email'; recipient: string; subject: string; body: string }
  | { type: 'phone'; phone: string };

export interface QrSettings { foreground: string; background: string; size: number }
export interface QrEntry { label: string; content: string }
export interface GeneratedQr { label: string; filename: string; blob: Blob; url: string }
export interface ImportedNetwork extends WifiInput { id: string }
export interface BackupResult { networks: ImportedNetwork[]; warnings: string[]; format: string }
