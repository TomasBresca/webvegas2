/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly JWT_SECRET: string;
  readonly ADMIN_USERNAME: string;
  readonly ADMIN_PASSWORD_HASH: string;
  readonly DEFAULT_WHATSAPP_NUMBER: string;
  readonly NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}