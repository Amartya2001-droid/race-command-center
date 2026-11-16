import type { BuildIdentity as Identity } from '@/types/deployment';
const currentBuild: Identity | null = typeof __BUILD_IDENTITY__ === 'undefined' ? null : __BUILD_IDENTITY__;
export function BuildIdentity({ identity = currentBuild }: { identity?: Identity | null }) {
  if (!identity) return <footer className="p-2 text-xs text-muted-foreground">Build identity unavailable in this development/test session.</footer>;
  return <footer aria-label="Deployment identity" className="p-2 text-xs text-muted-foreground border-t border-border flex flex-wrap gap-2">
    <span>Build {identity.commit.slice(0, 12)}</span><span>{identity.repository} · {identity.branch}</span>
    <span>{identity.dirty === null ? 'Unverified source — preview only' : identity.dirty ? 'Uncommitted source — preview only' : 'Clean source checkout'}</span>
    <a href="/build-identity.json" className="underline">Deployment manifest</a>
  </footer>;
}
