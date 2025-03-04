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
  scriptsHandling?: "keep" | "runAndKeep" | "runAndDelete";
  pocketbaseVersion?: string;
  profile?: string;
  quick?: boolean;
  template?: string; // Template to use: "default" or "monorepo"
  [key: string]: any;
}

export interface ProjectProfile {
  id: string;
  name: string;
  description: string;
  features?: {
    deploymentPlatform?: string;
    dockerConfig?: string;
    imageLoader?: string;
    includeGithubWorkflows?: boolean;
    scriptsHandling?: "keep" | "runAndKeep" | "runAndDelete";
    pocketbaseVersion?: string;
  };
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
