'use client';

import { useId } from 'react';
import type { QrInput, QrType } from './qr-types';

const inputClass = 'mt-2 w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:outline-accent';

// Each tab starts with understandable empty values, rather than an encoded protocol string.
export function emptyInput(type: QrType): QrInput {
  switch (type) {
    case 'text': return { type, text:'' };
    case 'wifi': return { type, ssid:'', password:'', encryption:'WPA', hidden:false };
    case 'contact': return { type, name:'', phone:'', email:'' };
    case 'email': return { type, recipient:'', subject:'', body:'' };
    case 'phone': return { type, phone:'' };
  }
}

// Share only ordinary labeled inputs; keep each content type's fields explicit below.
function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value:string) => void; type?: string; placeholder?: string }) {
  const id = useId();
  return <label htmlFor={id} className="block text-sm font-medium text-text">{label}<input id={id} value={value} type={type} placeholder={placeholder} autoComplete="off" onChange={event => onChange(event.target.value)} className={inputClass}/></label>;
}

// Inputs stay separate from payload construction so the formatting rules are easy to find.
export default function QrInputFields({ input, onChange }: { input: QrInput; onChange: (input: QrInput) => void }) {
  const id = useId();
  if (input.type === 'text') return <label htmlFor={id} className="block text-sm font-medium">Text or URL<textarea id={id} rows={4} value={input.text} onChange={event => onChange({ ...input, text:event.target.value })} placeholder="https://example.com or a little note…" className={inputClass}/><span className="mt-2 block text-xs font-normal leading-relaxed text-dim">Include https:// for a website. Plain text is preserved as entered.</span></label>;
  if (input.type === 'wifi') return <div className="space-y-4">
    <Field label="Network name (SSID)" value={input.ssid} onChange={ssid => onChange({ ...input, ssid })}/>
    <label htmlFor={id} className="block text-sm font-medium">Security<select id={id} value={input.encryption} onChange={event => onChange({ ...input, encryption:event.target.value as 'WPA'|'WEP'|'nopass' })} className={inputClass}><option value="WPA">WPA / WPA2 Personal</option><option value="WEP">WEP</option><option value="nopass">None (open network)</option></select></label>
    {input.encryption !== 'nopass' && <Field label="WiFi password" value={input.password} type="password" onChange={password => onChange({ ...input, password })}/>}
    <label className="flex items-center gap-2 text-sm text-dim"><input type="checkbox" checked={Boolean(input.hidden)} onChange={event => onChange({ ...input, hidden:event.target.checked })} className="h-4 w-4 accent-accent"/>Hidden network</label>
    <p className="text-xs leading-relaxed text-dim">Scanning offers to join on compatible phones. Anyone with this QR can read the network credentials.</p>
  </div>;
  if (input.type === 'contact') return <div className="space-y-4"><Field label="Full name" value={input.name} onChange={name => onChange({ ...input, name })}/><Field label="Phone (optional)" type="tel" value={input.phone} onChange={phone => onChange({ ...input, phone })}/><Field label="Email (optional)" type="email" value={input.email} onChange={email => onChange({ ...input, email })}/><p className="text-xs leading-relaxed text-dim">Creates a vCard. Compatible scanners offer to add the person to contacts.</p></div>;
  if (input.type === 'email') return <div className="space-y-4"><Field label="Recipient" type="email" value={input.recipient} onChange={recipient => onChange({ ...input, recipient })}/><Field label="Subject" value={input.subject} onChange={subject => onChange({ ...input, subject })}/><label htmlFor={id} className="block text-sm font-medium">Message<textarea id={id} rows={4} value={input.body} onChange={event => onChange({ ...input, body:event.target.value })} className={inputClass}/></label></div>;
  return <Field label="Phone number" type="tel" placeholder="+977 9800000000" value={input.phone} onChange={phone => onChange({ ...input, phone })}/>;
}
