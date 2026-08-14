/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}
