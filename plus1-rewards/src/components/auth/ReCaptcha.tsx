// plus1-rewards/src/components/auth/ReCaptcha.tsx
// Google reCAPTCHA Enterprise — invisible / programmatic execution
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (cb: () => void) => void
        execute: (siteKey: string, options: { action: string }) => Promise<string>
      }
    }
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string

/** Ensure the Enterprise script is loaded exactly once */
function loadEnterpriseScript() {
  if (document.getElementById('recaptcha-enterprise-script')) return
  const script = document.createElement('script')
  script.id = 'recaptcha-enterprise-script'
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}`
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

/**
 * Execute reCAPTCHA Enterprise and return a token.
 * Call this right before form submission.
 */
export async function executeRecaptcha(action: string): Promise<string> {
  loadEnterpriseScript()
  return new Promise((resolve, reject) => {
    const run = () => {
      window.grecaptcha.enterprise
        .execute(SITE_KEY, { action })
        .then(resolve)
        .catch(reject)
    }
    if (window.grecaptcha?.enterprise) {
      window.grecaptcha.enterprise.ready(run)
    } else {
      // Poll until the script is ready
      const interval = setInterval(() => {
        if (window.grecaptcha?.enterprise) {
          clearInterval(interval)
          window.grecaptcha.enterprise.ready(run)
        }
      }, 100)
    }
  })
}

/** Optional component — preloads the script on mount */
export default function ReCaptchaLoader() {
  const loaded = useRef(false)
  useEffect(() => {
    if (!loaded.current) {
      loadEnterpriseScript()
      loaded.current = true
    }
  }, [])
  return null
}
