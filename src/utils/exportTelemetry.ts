/** Export only simulator/session data supplied by the caller, never configuration. */
export function downloadTelemetry(data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'race-command-center.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Allow the browser to begin consuming the URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
