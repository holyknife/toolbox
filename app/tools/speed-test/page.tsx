import type { Metadata } from 'next';
import SpeedTest from './speed-test';
export const metadata: Metadata = { title: 'Speed test', description: 'Measure your connection’s ping, download, and upload speed using Cloudflare.' };
export default function Page() { return <SpeedTest/>; }
