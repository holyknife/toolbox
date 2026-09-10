'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface GridItem { id: string; content: ReactNode }

// Keep motion on wrappers so filtering never fights a card's hover/press transform.
export default function AnimatedGrid({ items, visibleIds }: { items: GridItem[]; visibleIds: string[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleKey = JSON.stringify(visibleIds);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const wanted = new Set<string>(JSON.parse(visibleKey));
    const elements = Array.from(grid.children) as HTMLElement[];
    const animations: Animation[] = [];
    let cancelled = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Hiding a fading card from keyboard/assistive navigation avoids stale results.
    for (const element of elements) element.inert = !wanted.has(element.dataset.gridId!);

    function animate(element: HTMLElement, frames: Keyframe[], duration: number) {
      const animation = element.animate(frames,{duration,easing:'ease-out',fill:'both'});
      animations.push(animation);
      return animation;
    }

    // FLIP: measure old positions, change layout once, then animate offsets to zero.
    // Transform/opacity frames run without recalculating layout on every frame.
    function arrange(motion: boolean) {
      const positions = new Map(elements.filter(element => !element.hidden)
        .map(element => [element,element.getBoundingClientRect()]));
      for (const element of elements) element.hidden = !wanted.has(element.dataset.gridId!);
      if (!motion) return;
      for (const element of elements.filter(element => !element.hidden)) {
        const before = positions.get(element);
        const after = element.getBoundingClientRect();
        const frames = before
          ? [{transform:`translate(${before.left - after.left}px, ${before.top - after.top}px)`},{transform:'translate(0, 0)'}]
          : [{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}];
        const animation = animate(element,frames,200);
        // Remove the finished transform so fixed tooltips and hover remain natural.
        void animation.finished.then(() => animation.cancel(),() => {});
      }
    }

    const leaving = elements.filter(element => !element.hidden && !wanted.has(element.dataset.gridId!));
    if (reduced.matches || typeof grid.animate !== 'function') arrange(false);
    else {
      const exits = leaving.map(element => animate(element,[{opacity:1},{opacity:0}],110));
      void Promise.allSettled(exits.map(animation => animation.finished)).then(() => {
        if (cancelled) return;
        arrange(!reduced.matches);
        exits.forEach(animation => animation.cancel());
      });
    }

    // Rapid typing or navigation cancels the previous batch, never a later query.
    const stopMotion = () => {
      if (!reduced.matches) return;
      cancelled = true;
      animations.forEach(animation => animation.cancel());
      arrange(false);
    };
    reduced.addEventListener('change',stopMotion);
    return () => {
      cancelled = true;
      animations.forEach(animation => animation.cancel());
      reduced.removeEventListener('change',stopMotion);
    };
  },[visibleKey]);

  return <div ref={gridRef} className="tool-grid">{items.map(item =>
    <div key={item.id} data-grid-id={item.id} className="animated-grid-item">{item.content}</div>
  )}</div>;
}
