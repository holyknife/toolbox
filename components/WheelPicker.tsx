'use client';

import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

export interface WheelOption { value: number; label: string }
interface WheelPickerProps {
  label: string;
  value: number;
  options: WheelOption[];
  onChange: (value: number) => void;
}

// A controlled, finite wheel. Positions and velocities are measured in rows, not pixels.
export default function WheelPicker({ label, value, options, onChange }: WheelPickerProps) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const height = useRef(44);
  const frame = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout>>();
  const reducedMotion = useRef(false);
  const lastPointerRelease = useRef(-Infinity);
  const drag = useRef<{ id: number; startY: number; lastY: number; lastTime: number; velocity: number; moved: boolean } | null>(null);
  const latest = useRef({ options, value, onChange });
  latest.current = { options, value, onChange };
  const optionKey = options.map(option => option.value).join(',');

  // One animation owner prevents an old flick from overwriting a newer gesture.
  function stop() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    clearTimeout(wheelTimer.current);
  }

  // Keep motion within the finite list; there are no blank selectable values at its ends.
  function bounded(index: number) {
    return Math.max(0, Math.min(latest.current.options.length - 1, index));
  }

  // Only transforms/opacity change per frame. Layout is measured separately on resize.
  function paint(nextPosition: number) {
    position.current = bounded(nextPosition);
    if (!track.current || !viewport.current) return;
    track.current.style.transform = `translate3d(0, ${-position.current * height.current}px, 0)`;
    const nearest = Math.round(position.current);
    for (const [index, row] of Array.from(track.current.children).entries()) {
      const element = row as HTMLElement;
      const distance = Math.abs(index - position.current);
      element.style.opacity = String(Math.max(0, 1 - distance * 0.3));
      element.style.transform = `scale(${Math.max(0.78, 1 - distance * 0.085)})`;
      element.dataset.centered = String(index === nearest);
      element.setAttribute('aria-selected', String(index === nearest));
    }
    const selected = latest.current.options[nearest];
    if (selected) viewport.current.setAttribute('aria-activedescendant', `${id}-${selected.value}`);
  }

  // Notify React only on settlement, keeping expensive date calculations off animation frames.
  function commit(index: number) {
    const selectedIndex = Math.round(bounded(index));
    paint(selectedIndex);
    const selected = latest.current.options[selectedIndex];
    if (selected && selected.value !== latest.current.value) latest.current.onChange(selected.value);
  }

  // Cubic ease-out starts fast and decelerates to zero at an exactly centered row.
  // A release velocity projects the destination; longer flicks get more travel/time.
  function settle(destination: number, velocity = 0) {
    stop();
    const target = Math.round(bounded(destination));
    const start = position.current;
    const distance = target - start;
    if (reducedMotion.current || Math.abs(distance) < 0.001) { commit(target); return; }
    const duration = velocity ? Math.max(240, Math.min(1100, 3 * Math.abs(distance / velocity))) : 320;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / duration);
      paint(start + distance * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else { frame.current = 0; commit(target); }
    }
    frame.current = requestAnimationFrame(tick);
  }

  // Parent updates (Today or a shorter month) cancel stale motion and realign the wheel.
  useEffect(() => {
    stop();
    drag.current = null;
    viewport.current?.removeAttribute('data-dragging');
    const selectedIndex = latest.current.options.findIndex(option => option.value === value);
    paint(Math.max(0, selectedIndex));
  }, [value, optionKey]);

  // Read row size only when layout changes; listen for live accessibility preference changes.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updateMotion() {
      reducedMotion.current = media.matches;
      if (media.matches) { stop(); commit(position.current); }
    }
    function measure() {
      height.current = (track.current?.firstElementChild as HTMLElement | null)?.offsetHeight || 44;
      paint(position.current);
    }
    updateMotion();
    measure();
    media.addEventListener('change', updateMotion);
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    // Non-passive is intentional: a wheel gesture should spin this column, not the page.
    const element = viewport.current;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      stop();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height.current * 5 : 1);
      const movement = Math.max(-3, Math.min(3, pixels / height.current));
      if (reducedMotion.current) { commit(position.current + Math.sign(movement)); return; }
      paint(position.current + movement);
      wheelTimer.current = setTimeout(() => settle(position.current), 100);
    }
    element?.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      stop();
      observer.disconnect();
      media.removeEventListener('change', updateMotion);
      element?.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Pointer capture keeps a mouse or finger drag working when it leaves the column.
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    stop();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
    drag.current = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, moved: false };
  }

  // Smooth the measured velocity to avoid a single noisy pointer sample causing a huge fling.
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
    const movement = (gesture.lastY - event.clientY) / height.current;
    if (Math.abs(event.clientY - gesture.startY) > 4) gesture.moved = true;
    gesture.velocity = gesture.velocity * 0.35 + (movement / elapsed) * 0.65;
    gesture.lastY = event.clientY;
    gesture.lastTime = event.timeStamp;
    paint(position.current + movement);
  }

  // A held-still release has no inertia. Cancellation always snaps without a fling.
  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    drag.current = null;
    lastPointerRelease.current = performance.now();
    event.currentTarget.removeAttribute('data-dragging');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!gesture.moved && !cancelled) {
      const bounds = event.currentTarget.getBoundingClientRect();
      settle(position.current + (event.clientY - bounds.top - bounds.height / 2) / height.current);
      return;
    }
    const velocity = cancelled || event.timeStamp - gesture.lastTime > 100 ? 0 : Math.max(-0.035, Math.min(0.035, gesture.velocity));
    settle(position.current + (reducedMotion.current ? 0 : velocity * 220), velocity);
  }

  // Keyboard navigation follows the same centering path as clicking and dragging.
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    let target = Math.round(position.current);
    if (event.key === 'ArrowDown') target++;
    else if (event.key === 'ArrowUp') target--;
    else if (event.key === 'PageDown') target += 10;
    else if (event.key === 'PageUp') target -= 10;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = options.length - 1;
    else return;
    event.preventDefault();
    settle(target);
  }

  return <div className="min-w-0">
    <div id={`${id}-label`} className="mb-3 text-center text-sm font-medium text-dim">{label}</div>
    <div className="wheel-picker-frame">
      <div className="wheel-picker-selection" aria-hidden="true"/>
      <div ref={viewport} role="listbox" tabIndex={0} aria-labelledby={`${id}-label`} aria-activedescendant={`${id}-${value}`} className="wheel-picker" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => endDrag(event, true)} onKeyDown={handleKey}>
        <div ref={track} className="wheel-picker-track">
          {options.map((option, index) => <div key={option.value} id={`${id}-${option.value}`} role="option" aria-selected={option.value === value} data-centered={option.value === value} className="wheel-picker-item" onClick={event => {
            // Pointer releases already center their row. Keep synthetic assistive clicks working.
            if (event.detail === 0 || performance.now() - lastPointerRelease.current > 100) settle(index);
          }}>{option.label}</div>)}
        </div>
      </div>
    </div>
  </div>;
}
