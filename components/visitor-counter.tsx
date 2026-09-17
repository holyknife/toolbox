'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function recordOrFetchVisitor() {
      try {
        const hasVisited = typeof window !== 'undefined' && window.sessionStorage.getItem('toolbox_visitor_logged');
        const endpoint = hasVisited ? '/api/visitors' : '/api/visitors?inc=1';

        const res = await fetch(endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch visitor count');

        const data = await res.json();
        if (isMounted && typeof data.count === 'number') {
          setCount(data.count);
          if (!hasVisited && typeof window !== 'undefined') {
            window.sessionStorage.setItem('toolbox_visitor_logged', '1');
          }
        }
      } catch (err) {
        console.warn('Visitor counter unavailable:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    recordOrFetchVisitor();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && count === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-text-dim opacity-70" aria-label="Loading visitor count">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
        <span>... visitors</span>
      </span>
    );
  }

  if (count === null) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text transition-colors cursor-default"
      title="Live total visitor count via Upstash Redis"
      aria-label={`${count.toLocaleString()} visitors`}
    >
      <Users size={13} className="text-text-dim/70" />
      <span className="font-semibold text-text tabular-nums">{count.toLocaleString()}</span>
      <span>{count === 1 ? 'visitor' : 'visitors'}</span>
    </span>
  );
}
