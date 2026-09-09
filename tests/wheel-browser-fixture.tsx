'use client';

// Temporary browser-test host: mount via a dev-only route; never expose in production.
import { useRef, useState } from 'react';
import DateConverter from '../app/tools/date-converter/date-converter';

const pause = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export default function WheelBrowserFixture() {
  const host = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState('Ready');
  const [reduced, setReduced] = useState(false);
  const originalMatchMedia = useRef<typeof window.matchMedia>();

  // Only the test host substitutes reduced motion; production always reads the OS preference.
  function toggleMotion() {
    if (!originalMatchMedia.current) originalMatchMedia.current = window.matchMedia.bind(window);
    const next = !reduced;
    window.matchMedia = query => {
      const media = originalMatchMedia.current!(query);
      if (query === '(prefers-reduced-motion: reduce)') Object.defineProperty(media, 'matches', { value: next });
      return media;
    };
    setReduced(next);
    setReport('Ready');
  }

  // Synthetic touch pointers exercise the actual browser React handlers and rAF animations.
  // Capture requires a trusted OS pointer; mouse testing verifies that separately.
  async function run() {
    setReport('Running…');
    const lines: string[] = [];
    const wheels = Array.from(host.current!.querySelectorAll<HTMLElement>('[role="listbox"]'));
    const [year, month, day] = wheels;
    const selected = (element: HTMLElement) => element.querySelector('[aria-selected="true"]')!.textContent!;
    const transform = (element: HTMLElement) => (element.firstElementChild as HTMLElement).style.transform;
    const centered = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      const row = element.querySelector('[aria-selected="true"]')!.getBoundingClientRect();
      return Math.abs(row.y + row.height / 2 - box.y - box.height / 2) < 0.5;
    };
    const assert = (condition: boolean, name: string) => { if (!condition) throw new Error(name); lines.push(`PASS: ${name}`); };
    async function swipe(element: HTMLElement, cancel = false) {
      const originalCapture = element.setPointerCapture;
      element.setPointerCapture = () => {};
      const box = element.getBoundingClientRect();
      const pointer = (type: string, y: number) => element.dispatchEvent(new PointerEvent(type, { bubbles:true, pointerId:77, pointerType:'touch', isPrimary:true, button:0, buttons:type === 'pointerup' ? 0 : 1, clientX:box.x + box.width / 2, clientY:y }));
      try {
        pointer('pointerdown', box.y + 160);
        for (let step = 1; step <= 5; step++) { await pause(16); pointer('pointermove', box.y + 160 - step * 15); }
        pointer(cancel ? 'pointercancel' : 'pointerup', box.y + 85);
      } finally { element.setPointerCapture = originalCapture; }
    }
    try {
      const beforeYear = selected(year);
      const beforeMonth = selected(month);
      const beforeDay = selected(day);
      await swipe(year);
      const released = transform(year);
      await pause(80);
      assert(reduced ? transform(year) === released : transform(year) !== released, reduced ? 'Reduced motion stops instantly on release' : 'Touch flick continues moving after release');
      await pause(1200);
      assert(centered(year), 'Touch flick snaps exactly to a row');
      assert(selected(year) !== beforeYear, 'Touch changes year');
      assert(selected(month) === beforeMonth && selected(day) === beforeDay, 'Other columns remain independent');
      const tapRow = year.querySelector('[aria-selected="true"]')!.previousElementSibling as HTMLElement;
      const tappedText = tapRow.textContent;
      tapRow.click();
      await pause(400);
      assert(selected(year) === tappedText && centered(year), 'Visible adjacent value centers on tap');
      await swipe(month, true);
      await pause(500);
      assert(centered(month), 'Cancelled touch snaps without stale drag');
      // Pick Baisakh then its maximum day; a shorter month must clamp that day.
      month.dispatchEvent(new KeyboardEvent('keydown', { key:'Home', bubbles:true }));
      await pause(400);
      month.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowDown', bubbles:true }));
      await pause(400);
      day.dispatchEvent(new KeyboardEvent('keydown', { key:'End', bubbles:true }));
      await pause(400);
      const longDay = Number(selected(day));
      month.dispatchEvent(new KeyboardEvent('keydown', { key:'End', bubbles:true }));
      await pause(500);
      const maxDay = Math.max(...Array.from(day.querySelectorAll('[role="option"]')).map(row => Number(row.textContent)));
      assert(Number(selected(day)) === Math.min(longDay, maxDay) && centered(day), 'Shorter BS month clamps the day and recenters');
      assert(wheels.every(centered), 'All columns finish on exact centers');
      setReport(lines.join('\n'));
    } catch (error) { setReport(lines.join('\n') + '\nFAIL: ' + String(error)); }
  }

  return <div><div className="m-5 flex gap-4"><button className="primary-button" onClick={run}>Run touch checks</button><button className="primary-button" onClick={toggleMotion}>Reduced motion: {reduced ? 'on' : 'off'}</button></div><pre className="m-5 whitespace-pre-wrap text-sm" role="status">{report}</pre><div ref={host} key={String(reduced)}><DateConverter/></div></div>;
}
