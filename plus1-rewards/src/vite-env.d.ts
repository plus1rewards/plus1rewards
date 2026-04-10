/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_AFRICAS_TALKING_API_KEY: string
  readonly VITE_AFRICAS_TALKING_USERNAME: string
  readonly VITE_AFRICAS_TALKING_SENDER_ID: string
  readonly VITE_AFRICAS_TALKING_MODE: string
  readonly VITE_APP_URL: string
  readonly VITE_PWA_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
