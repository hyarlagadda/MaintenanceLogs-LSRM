import { useState } from "react"
import { supabase } from "../lib/supabase"

type Mode = "login" | "register"
type Step = "form" | "magic_sent" | "verify_sent"

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [step, setStep] = useState<Step>("form")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<"password" | "magic">("password")

  const clearError = () => setError(null)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()

    if (method === "magic") {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: mode === "register" },
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setStep("magic_sent")
      return
    }

    if (mode === "register") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setStep("verify_sent")
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (err) setError(err.message)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    clearError()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin, queryParams: { access_type: "offline", prompt: "consent" } },
    })
    setLoading(false)
    if (err) setError(err.message)
  }

  if (step === "magic_sent" || step === "verify_sent") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16" style={{ backgroundColor: "var(--color-background)" }}>
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center border-2" style={{ borderColor: "var(--color-accent)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--color-accent)" }}>
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
            {step === "verify_sent" ? "Verify your email" : "Check your email"}
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--color-muted-foreground)" }}>
            We sent a {step === "verify_sent" ? "verification" : "sign-in"} link to
          </p>
          <p className="text-sm font-semibold mb-6" style={{ fontFamily: "var(--font-mono)", color: "var(--color-foreground)" }}>{email}</p>
          <p className="text-xs mb-8" style={{ color: "var(--color-muted-foreground)" }}>
            {step === "verify_sent"
              ? "Click the link in the email to verify your account and complete registration. The link expires in 24 hours."
              : "Click the link in the email to sign in instantly. The link is single-use and expires in 1 hour."}
          </p>
          <button
            onClick={() => { setStep("form"); setEmail(""); setPassword("") }}
            className="text-xs underline underline-offset-2"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "var(--color-background)" }}>
      <header style={{ backgroundColor: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary-foreground)" }}>
            <div className="text-xs tracking-widest uppercase opacity-60 mb-0.5" style={{ fontFamily: "var(--font-mono)" }}>Aircraft Maintenance</div>
            <h1 className="text-2xl font-bold leading-none">FlightLog</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex border-b mb-8" style={{ borderColor: "var(--color-border)" }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); clearError(); setStep("form") }}
                className="px-6 py-3 text-xs font-semibold tracking-widest uppercase border-b-2 -mb-px transition-all"
                style={{
                  fontFamily: "var(--font-mono)",
                  borderColor: mode === m ? "var(--color-accent)" : "transparent",
                  color: mode === m ? "var(--color-primary)" : "var(--color-muted-foreground)",
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--color-muted-foreground)" }}>
            {mode === "login" ? "Sign in to access your maintenance records." : "Start tracking your fleet's maintenance history."}
          </p>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border mb-4 text-sm font-medium transition-all disabled:opacity-50"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-foreground)" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--color-secondary)" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-card)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
          </div>

          <div className="flex gap-1 mb-5 p-1 border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-secondary)" }}>
            {([
              { val: "password" as const, label: "Password" },
              { val: "magic" as const, label: "Magic Link" },
            ]).map(({ val, label }) => (
              <button
                key={val}
                onClick={() => { setMethod(val); clearError() }}
                className="flex-1 py-1.5 text-xs font-semibold tracking-wide transition-all"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: method === val ? "var(--color-card)" : "transparent",
                  color: method === val ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  boxShadow: method === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailAuth} noValidate>
            <div className="mb-4">
              <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError() }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 text-sm border outline-none transition-all"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-ring)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,58,92,0.12)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none" }}
              />
            </div>

            {method === "password" && (
              <div className="mb-6">
                <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError() }}
                  placeholder={mode === "register" ? "Min. 8 characters" : "Your password"}
                  required
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  minLength={mode === "register" ? 8 : undefined}
                  className="w-full px-3 py-2.5 text-sm border outline-none transition-all"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-ring)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,58,92,0.12)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none" }}
                />
              </div>
            )}

            {method === "magic" && (
              <p className="mb-6 text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
                {"We'll email you a secure, single-use link. No password needed."}
              </p>
            )}

            {error && (
              <div className="mb-4 px-3 py-2.5 text-xs border" style={{ borderColor: "var(--color-status-alert)", backgroundColor: "rgba(200,75,17,0.06)", color: "var(--color-status-alert)", fontFamily: "var(--font-mono)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.88" }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
            >
              {loading ? "Please wait…" : method === "magic"
                ? (mode === "register" ? "Send Registration Link" : "Send Sign-In Link")
                : (mode === "register" ? "Create Account" : "Sign In")}
            </button>
          </form>

          <p className="mt-6 text-xs text-center" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
            {mode === "login" ? (
              <>{"Don't have an account? "}<button onClick={() => { setMode("register"); clearError() }} className="underline underline-offset-2" style={{ color: "var(--color-primary)" }}>Register</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode("login"); clearError() }} className="underline underline-offset-2" style={{ color: "var(--color-primary)" }}>Sign in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
