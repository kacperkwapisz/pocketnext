export interface CreateOptions {
  skipInstall?: boolean;
  useNpm?: boolean;
  useYarn?: boolean;
  usePnpm?: boolean;
  useBun?: boolean;
  packageManager?: string;
  yes?: boolean;
  deploymentPlatform?: string;
  dockerConfig?: string;
  imageLoader?: string;
  includeGithubWorkflows?: boolean;
  [key: string]: any;
}

export interface Feature {
  name: string;
  description: string;
  dependencies: string[];
  setup: (targetDir: string) => Promise<void>;
}

export interface FeatureOption {
  id: string;
  name: string;
  description: string;
}

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  exclusive?: boolean; // If true, only one option can be selected
  options: FeatureOption[];
}

export interface PocketbaseConfig {
  email: string;
  password: string;
}
