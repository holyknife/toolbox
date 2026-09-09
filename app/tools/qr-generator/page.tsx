import type { Metadata } from 'next';
import QrGenerator from './qr-generator';

export const metadata: Metadata = {
  title: 'QR Code Generator',
  description: 'Create QR codes for links, WiFi, contacts, email, and phone numbers locally in your browser.',
};

// Keep page metadata on the server; inputs and generated files stay in the browser.
export default function Page() {
  return <QrGenerator/>;
}
