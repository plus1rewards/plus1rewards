// Shared styled input for auth forms
const BLUE = '#1a558b'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: string
  suffix?: React.ReactNode
  hint?: string
  required?: boolean
}

export function AuthInput({ label, icon, suffix, hint, id, required, ...props }: AuthInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      <label 
        htmlFor={id}
        style={{
          fontSize: '0.75rem',
          color: BLUE,
          fontWeight: 700,
          position: 'relative',
          top: '0.5rem',
          margin: '0 0 0 7px',
          padding: '0 3px',
          background: '#f5f8fc',
          width: 'fit-content',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: BLUE }}>{icon}</span>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className="auth-input-override"
          style={{
            padding: '11px 10px',
            paddingRight: suffix ? '40px' : '10px',
            fontSize: '0.875rem',
            border: `2px solid ${BLUE}`,
            borderRadius: '5px',
            background: '#f5f8fc',
            width: '100%',
            outline: 'none',
            color: '#111827',
            boxShadow: 'none'
          }}
          {...props}
        />
        {suffix && (
          <div style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)' }}>
            {suffix}
          </div>
        )}
      </div>
      {hint && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{hint}</p>}
    </div>
  )
}

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'outline'
}

export function AuthButton({ loading, loadingText, variant = 'primary', children, ...props }: AuthButtonProps) {
  const primary = { backgroundColor: BLUE, color: '#fff', border: 'none' }
  const outline = { backgroundColor: 'transparent', color: BLUE, border: `2px solid ${BLUE}` }
  return (
    <button
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
      style={variant === 'primary' ? primary : outline}
      {...props}
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined animate-spin text-base">refresh</span>
          {loadingText}
        </>
      ) : children}
    </button>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-100" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-white text-gray-400 text-xs uppercase tracking-widest font-bold">{label}</span>
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
      <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0">error</span>
      <p className="text-sm text-red-700 leading-relaxed">{message}</p>
    </div>
  )
}

export function AuthLink({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) {
  return (
    <span
      onClick={onClick}
      className="font-bold hover:underline cursor-pointer"
      style={{ color: BLUE }}
      {...(href ? { onClick: () => window.location.href = href! } : {})}
    >
      {children}
    </span>
  )
}
