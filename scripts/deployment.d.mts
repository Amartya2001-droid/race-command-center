import type { BuildIdentity, DeploymentContract } from '../src/types/deployment';
export function digest(bytes: string | Uint8Array): string;
export function createIdentity(source: Omit<BuildIdentity, 'schemaVersion' | 'contract' | 'assets'>, contract: DeploymentContract): BuildIdentity;
export function checkIdentity(identity: BuildIdentity | null, expected: Pick<BuildIdentity, 'commit' | 'repository' | 'branch' | 'contract'>): string[];
export function verifyDeployment(baseUrl: string, expected: Pick<BuildIdentity, 'commit' | 'repository' | 'branch' | 'contract'>, read: (url: string) => Promise<Buffer>, options?: { strictHtml?: boolean }): Promise<{ok: boolean; errors: string[]; identity: BuildIdentity | null; htmlBytesMatch?: boolean}>;
