'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileArchive, QrCode, ShieldCheck, Upload, X } from 'lucide-react';
import QrInputFields, { emptyInput } from './qr-input-fields';
import { buildQrContent, buildTextBatch, MAX_BATCH } from './qr-builder';
import { MAX_BACKUP_BYTES, parseMiuiBackup } from './miui-bak-parser';
import { qrFilename, renderQrPng, validateSettings } from './qr-renderer';
import { createQrZip } from './qr-downloads';
import type { BackupResult, GeneratedQr, QrEntry, QrInput, QrSettings, QrType } from './qr-types';

const types: { value: QrType; label: string }[] = [{ value:'text', label:'Text / URL' }, { value:'wifi', label:'WiFi' }, { value:'contact', label:'Contact' }, { value:'email', label:'Email' }, { value:'phone', label:'Phone' }];
const controlClass = 'w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:outline-accent';

// Make all visible errors actionable, without dumping a credential or raw parser diagnostic.
function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

// Revoke generated URLs when output is replaced; files and credentials are never persisted.
function releaseResults(results: GeneratedQr[]) {
  for (const result of results) URL.revokeObjectURL(result.url);
}

// Single, text-batch, and imported WiFi entries converge on the same PNG/ZIP pipeline.
export default function QrGenerator() {
  const [mode, setMode] = useState<'single'|'batch'>('single');
  const [input, setInput] = useState<QrInput>(emptyInput('text'));
  const [batchText, setBatchText] = useState('');
  const [batchSource, setBatchSource] = useState<'text'|'backup'>('text');
  const [backup, setBackup] = useState<BackupResult | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const backupInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [settings, setSettings] = useState<QrSettings>({ foreground:'', background:'', size:512 });
  const [results, setResults] = useState<GeneratedQr[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [zipUrl, setZipUrl] = useState('');
  const active = useRef(true);
  const job = useRef(0);
  const files = useRef<GeneratedQr[]>([]);
  const archive = useRef('');

  // Shared light-ink/light-paper QR tokens stay scannable even when the app is in dark mode.
  useEffect(() => {
    active.current = true;
    const style = getComputedStyle(document.documentElement);
    setSettings(previous => ({ ...previous, foreground:style.getPropertyValue('--qr-ink').trim(), background:style.getPropertyValue('--qr-paper').trim() }));
    return () => { active.current = false; job.current++; releaseResults(files.current); URL.revokeObjectURL(archive.current); };
  }, []);

  // An edit invalidates old downloads so the preview always describes the current inputs.
  function clearOutput() {
    job.current++;
    releaseResults(files.current);
    files.current = [];
    setResults([]);
    URL.revokeObjectURL(archive.current);
    archive.current = '';
    setZipUrl('');
    setError('');
    setStatus('');
  }

  // Retain the chosen size when restoring the shared, scan-friendly default colors.
  function resetColors() {
    const style = getComputedStyle(document.documentElement);
    clearOutput();
    setSettings(previous => ({ ...previous, foreground:style.getPropertyValue('--qr-ink').trim(), background:style.getPropertyValue('--qr-paper').trim() }));
  }

  // Prepare typed input once; backup selections reuse the exact same WiFi builder as the tab.
  function entriesToGenerate(): QrEntry[] {
    if (mode === 'single') return [{ label:input.type === 'wifi' ? input.ssid : types.find(type => type.value === input.type)!.label, content:buildQrContent(input) }];
    if (batchSource === 'text') return buildTextBatch(batchText);
    const networks = backup?.networks.filter(network => selected.includes(network.id)) || [];
    if (!networks.length) throw new Error('Select at least one imported network.');
    if (networks.length > MAX_BATCH) throw new Error(`Choose up to ${MAX_BATCH} networks at a time.`);
    return networks.map(network => ({ label:network.ssid, content:buildQrContent({ type:'wifi', ...network }) }));
  }

  // Render sequentially and yield between images so a batch does not monopolize the UI.
  async function generate() {
    if (busy) return;
    clearOutput();
    const currentJob = job.current;
    const completed: GeneratedQr[] = [];
    try {
      validateSettings(settings);
      const entries = entriesToGenerate();
      setBusy(true);
      for (let index = 0; index < entries.length; index++) {
        if (!active.current || job.current !== currentJob) { releaseResults(completed); return; }
        setStatus(`Generating ${index + 1} of ${entries.length}…`);
        let blob: Blob;
        try { blob = await renderQrPng(entries[index].content,settings); }
        catch (reason) { throw new Error(`Entry ${index + 1}: ${messageFor(reason)}`); }
        completed.push({ label:entries[index].label, filename:qrFilename(index), blob, url:URL.createObjectURL(blob) });
        await new Promise(resolve => setTimeout(resolve,0));
      }
      if (!active.current || currentJob !== job.current) { releaseResults(completed); return; }
      files.current = completed;
      setResults(completed);
      setStatus(`${completed.length} QR ${completed.length === 1 ? 'code is' : 'codes are'} ready. ${settings.size} × ${settings.size} px PNG.`);
    } catch (reason) {
      releaseResults(completed);
      if (active.current && currentJob === job.current) { setError(messageFor(reason)); setStatus(''); }
    } finally { if (active.current) setBusy(false); }
  }

  // Parse only an explicitly chosen local backup and pause for review before QR generation.
  async function importBackup(file: File | undefined) {
    if (!file || busy) return;
    clearOutput();
    setBackupFile(file);
    setImportError('');
    setImportStatus('Reading your backup locally…');
    setBackup(null);
    setSelected([]);
    setBusy(true);
    const currentJob = job.current;
    try {
      if (!file.name.toLowerCase().endsWith('.bak')) throw new Error('Choose a MIUI WiFi .bak file. You can also enter networks manually in the WiFi tab.');
      if (file.size > MAX_BACKUP_BYTES) throw new Error('This backup is larger than 20 MB. Export only WiFi settings, or use the manual WiFi tab.');
      const imported = await parseMiuiBackup(await file.arrayBuffer());
      if (!active.current || currentJob !== job.current) return;
      setBackup(imported);
      setSelected(imported.networks.slice(0,MAX_BATCH).map(network => network.id));
      setImportStatus(`Found ${imported.networks.length} ${imported.networks.length === 1 ? 'network' : 'networks'}. Review your selection before generating.`);
    } catch (reason) {
      if (active.current && currentJob === job.current) {
        setImportError(messageFor(reason));
        setImportStatus('');
      }
    }
    finally { if (active.current) setBusy(false); }
  }

  // Only an explicit clear removes the selected file; retries can reuse the same file.
  function clearBackup() {
    clearOutput();
    setBackup(null);
    setBackupFile(null);
    setSelected([]);
    setImportStatus('');
    setImportError('');
    if (backupInput.current) backupInput.current.value = '';
  }

  // Build ZIP lazily; keep an explicit download link for browsers that block delayed downloads.
  async function downloadAll() {
    if (busy || !results.length) return;
    setBusy(true);
    setError('');
    setStatus('Preparing your ZIP…');
    const currentJob = job.current;
    try {
      const blob = await createQrZip(results);
      if (!active.current || currentJob !== job.current) return;
      URL.revokeObjectURL(archive.current);
      const url = URL.createObjectURL(blob);
      archive.current = url;
      setZipUrl(url);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'toolbox-qr-codes.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus('ZIP ready. If the download did not start, use the ZIP link below.');
    } catch { if (active.current) { setError('Could not package the ZIP. Try fewer codes, or download them individually.'); setStatus(''); } }
    finally { if (active.current) setBusy(false); }
  }

  return <div className="page">
    <Link href="/" className="back-link"><ArrowLeft size={14}/>All tools</Link>
    <div className="tool-heading"><span className="tool-icon"><QrCode size={28}/></span><div><h1>QR Code Generator</h1><p>A little square. A lot to share.</p></div></div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(260px,1fr)]">
      <section className="min-w-0 rounded-panel border border-border bg-panel p-5 sm:p-6" aria-label="QR content and settings">
        <fieldset disabled={busy} className="min-w-0 space-y-6 disabled:opacity-70">
          <div role="group" aria-label="Generation mode" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg p-1">{(['single','batch'] as const).map(value => <button key={value} aria-pressed={mode === value} onClick={() => { clearOutput(); setMode(value); }} className={`rounded-lg p-3 text-sm font-medium ${mode === value ? 'bg-panel text-accent' : 'text-dim'}`}>{value === 'single' ? 'One QR code' : 'Batch generation'}</button>)}</div>
          {mode === 'single' ? <><div role="group" aria-label="QR content type" className="flex flex-wrap gap-2">{types.map(type => <button key={type.value} aria-pressed={input.type === type.value} onClick={() => { clearOutput(); setInput(emptyInput(type.value)); }} className={`rounded-lg border border-border px-3 py-2 text-sm ${input.type === type.value ? 'bg-bg font-medium text-accent' : 'text-dim'}`}>{type.label}</button>)}</div><QrInputFields input={input} onChange={next => { clearOutput(); setInput(next); }}/></> : <>
            <label className="block text-sm font-medium">Batch source<select value={batchSource} onChange={event => { clearOutput(); setBatchSource(event.target.value as 'text'|'backup'); }} className={`${controlClass} mt-2`}><option value="text">Text / URLs · one per line</option><option value="backup">MIUI WiFi backup (.bak)</option></select></label>
            {batchSource === 'text' ? <label className="block text-sm font-medium">Your entries<textarea rows={6} value={batchText} onChange={event => { clearOutput(); setBatchText(event.target.value); }} placeholder={'https://example.com\nHello from Toolbox\nhttps://example.org'} className={`${controlClass} mt-2`}/><span className="mt-2 block text-xs font-normal text-dim">One text or URL entry per line. Blank lines are ignored. Up to {MAX_BATCH} codes.</span></label> : <div className="space-y-4">
              <label className="block text-sm font-medium"><span className="mb-2 flex items-center gap-2"><Upload size={16}/>Import WiFi settings</span><input ref={backupInput} type="file" accept=".bak" aria-describedby="backup-file-feedback" onChange={event => { void importBackup(event.currentTarget.files?.[0]); }} className="w-full rounded-lg border border-border bg-bg p-3 text-xs text-dim file:mr-2 file:rounded-md file:border-0 file:bg-panel file:px-2 file:py-2 file:text-text"/></label>
              <div id="backup-file-feedback" className="space-y-2">
                {backupFile && <p className="break-words text-sm text-text">Selected: <strong>{backupFile.name}</strong> <span className="text-dim">({(backupFile.size / 1024).toFixed(1)} KB)</span></p>}
                <p role="status" aria-live="polite" className="text-sm text-accent">{importStatus}</p>
                {importError && <p role="alert" className="error">{importError}</p>}
                {backupFile && <div className="flex flex-wrap gap-4">
                  {importError && <button onClick={() => void importBackup(backupFile)} className="text-sm text-accent underline">Retry import</button>}
                  <button onClick={clearBackup} className="flex items-center gap-1 text-xs text-dim underline"><X size={13}/>Clear selected backup</button>
                </div>}
              </div>
              <p className="text-xs leading-relaxed text-dim">For supported unencrypted MIUI backups, up to 20 MB. Formats vary across versions. Passwords stay in this page’s memory and are included in the generated WiFi codes.</p>
              <button onClick={() => { clearOutput(); setMode('single'); setInput(emptyInput('wifi')); }} className="text-sm text-accent underline">Add a WiFi network manually</button>
              {backup && <div className="rounded-lg border border-border bg-bg p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Review networks ({selected.length} selected)</h2><button className="text-xs text-accent underline" onClick={() => { clearOutput(); setSelected(selected.length ? [] : backup.networks.slice(0,MAX_BATCH).map(network => network.id)); }}>{selected.length ? 'Deselect all' : 'Select first 100'}</button></div><div className="max-h-64 space-y-3 overflow-y-auto">{backup.networks.map(network => <label key={network.id} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={selected.includes(network.id)} onChange={event => { clearOutput(); setSelected(previous => event.target.checked ? [...previous,network.id] : previous.filter(id => id !== network.id)); }} className="mt-1 h-4 w-4 accent-accent"/><span className="min-w-0 break-words text-text">{network.ssid}<small className="block text-xs text-dim">{network.encryption === 'nopass' ? 'Open network' : network.encryption}{network.hidden ? ' · Hidden' : ''}</small></span></label>)}</div>{backup.warnings.map(warning => <p key={warning} className="mt-3 text-xs leading-relaxed text-dim">{warning}</p>)}</div>}
            </div>}
          </>}
          <div className="border-t border-border pt-5"><h2 className="mb-4 text-sm font-semibold">Make it yours</h2><div className="grid grid-cols-2 gap-4"><label className="text-sm text-dim">QR color<input aria-label="QR code color" type="color" value={settings.foreground} onChange={event => { clearOutput(); setSettings({ ...settings, foreground:event.target.value }); }} className="mt-2 block h-11 w-full rounded-lg border border-border bg-bg p-1"/></label><label className="text-sm text-dim">Background<input aria-label="QR background color" type="color" value={settings.background} onChange={event => { clearOutput(); setSettings({ ...settings, background:event.target.value }); }} className="mt-2 block h-11 w-full rounded-lg border border-border bg-bg p-1"/></label></div><div className="mt-4 flex flex-wrap items-end gap-4"><label className="min-w-0 flex-1 text-sm text-dim">PNG resolution<select value={settings.size} onChange={event => { clearOutput(); setSettings({ ...settings, size:Number(event.target.value) }); }} className={`${controlClass} mt-2`}>{[256,512,1024,2048].map(size => <option key={size} value={size}>{size} × {size} px</option>)}</select></label><button onClick={resetColors} className="pb-3 text-xs text-accent underline">Reset colors</button></div><p className="mt-3 text-xs leading-relaxed text-dim">Choose any colors you like. Reset colors restores the defaults.</p></div>
          <button onClick={generate} disabled={!settings.foreground} className="primary-button w-full"><QrCode size={17}/>{mode === 'single' ? 'Generate QR code' : batchSource === 'backup' ? 'Generate selected networks' : 'Generate batch'}</button>
        </fieldset>
        <p role="status" aria-live="polite" className="mt-4 text-sm text-accent">{status}</p>{error && <p role="alert" className="error">{error}</p>}
      </section>
      <aside className="rounded-panel border border-border bg-panel p-5 sm:p-6"><h2 className="mb-5 text-base font-semibold">{results.length > 1 ? 'Your QR collection' : 'Your QR code'}</h2>
        {!results.length ? <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-bg p-7 text-center text-dim"><QrCode size={64} strokeWidth={1}/><p className="text-sm leading-relaxed">Add your content, then generate.<br/>Your scannable code will appear here.</p></div> : <div className={results.length > 1 ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1' : ''}>{results.map(result => <div key={result.filename} className="min-w-0 rounded-xl border border-border p-4"><img src={result.url} alt={`QR code for ${result.label}`} width={settings.size} height={settings.size} className="mx-auto h-auto w-full max-w-64"/><p className="mt-3 break-words text-center text-sm font-medium">{result.label}</p><a href={result.url} download={result.filename} className="mt-3 flex items-center justify-center gap-2 text-sm text-accent"><Download size={15}/>Download PNG</a></div>)}</div>}
        {mode === 'batch' && results.length > 0 && <button disabled={busy} onClick={downloadAll} className="primary-button mt-5 w-full"><FileArchive size={17}/>Download All as ZIP</button>}
        {zipUrl && <a href={zipUrl} download="toolbox-qr-codes.zip" className="mt-3 block text-center text-sm text-accent underline">Download prepared ZIP</a>}
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-dim"><ShieldCheck size={15}/>Created on your device. No uploads.</p>
      </aside>
    </div>
  </div>;
}


