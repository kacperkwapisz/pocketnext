import "prompts";

declare module "prompts" {
  interface PromptObject<T extends string> {
    onCancel?: () => boolean | Promise<boolean>;
  }
}
