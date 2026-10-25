declare module "@foundryvtt/foundryvtt-cli" {
  interface PackOptions {
    log?: boolean;
    recursive?: boolean;
    documentType?: string;
    transformName?: (doc: { name?: string; _id?: string }) => string | Promise<string>;
  }
  export function compilePack(src: string, dest: string, options?: PackOptions): Promise<void>;
  export function extractPack(src: string, dest: string, options?: PackOptions): Promise<void>;
}
