import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MAX_RECORDING_BYTES } from '@/utils/recordingStorage';

export function RecordingImport({ disabled, onImport }: { disabled: boolean; onImport: (json: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async (file?: File) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      if (file.size > MAX_RECORDING_BYTES) throw new Error('Recording exceeds the 4 MiB limit.');
      onImport(await file.text());
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not read recording.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="flex flex-col gap-1">
    <Button variant="outline" size="sm" disabled={disabled || busy} onClick={() => input.current?.click()}>
      {busy ? 'IMPORTING…' : 'IMPORT RECORDING'}
    </Button>
    <input ref={input} type="file" accept=".json,application/json" aria-label="Import recording file" className="sr-only"
      disabled={disabled || busy} onChange={event => { void load(event.target.files?.[0]); }} />
    {error && <span role="alert" className="text-xs text-critical max-w-64">{error}</span>}
  </div>;
}
