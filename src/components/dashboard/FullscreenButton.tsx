import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FullscreenButton() {
  const [active, setActive] = useState(!!document.fullscreenElement);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setActive(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggle = async () => {
    setError(null);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        throw new Error('Fullscreen is not supported by this browser.');
      }
    } catch {
      setError('Fullscreen unavailable. Your browser may not support or allow it.');
    }
  };

  return <>
    <Button aria-label={active ? 'Exit fullscreen' : 'Enter fullscreen'} aria-pressed={active}
      variant="ghost" size="icon" onClick={toggle}>
      {active ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </Button>
    {error && <span role="alert" className="text-xs text-warning max-w-48">{error}</span>}
  </>;
}
