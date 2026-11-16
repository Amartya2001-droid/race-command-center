export interface DeploymentContract {
  schemaVersion: 1;
  repository: string;
  branch: string;
  liveUrl: string;
  lovableProjectId: string;
}
export interface BuildIdentity {
  schemaVersion: 1;
  commit: string;
  repository: string;
  branch: string;
  dirty: boolean | null;
  builtAt: string;
  contract: DeploymentContract;
  assets?: Array<{ path: string; sha256: string; entrypoint?: boolean }>;
}
