import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { account } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { BarChart2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, userId } = useAuthStore()
  const [tab, setTab] = useState('magic')        // 'magic' | 'password'
  const [mode, setMode] = useState('signin')     // 'signin' | 'signup' (for password tab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (userId) navigate('/dashboard', { replace: true })
  }, [userId])

  // Handle OAuth2Token + MagicLink callbacks (both send ?userId=&secret= to this page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlUserId = params.get('userId')
    const secret = params.get('secret')
    const provider = params.get('provider') // 'oauth' for Google, absent for magic link

    if (urlUserId && secret) {
      setLoading(true)
      window.history.replaceState({}, '', '/login')

      const sessionPromise = provider === 'oauth'
        ? account.createSession(urlUserId, secret)       // OAuth2Token flow
        : account.updateMagicURLSession(urlUserId, secret) // Magic link flow

      sessionPromise
        .then(() => account.get())
        .then((user) => {
          setUser(user)
          navigate('/dashboard', { replace: true })
        })
        .catch((e) => {
          setError(e.message ?? 'Sign-in link expired or invalid. Try again.')
          setLoading(false)
        })
    }

    // OAuth failure redirect — Appwrite appends ?error=... on failure
    const oauthError = params.get('error')
    if (oauthError) {
      const messages = {
        project_provider_disabled: "Google sign-in isn't enabled yet. Use Magic Link or Email/Password instead.",
        user_oauth2_unauthorized: 'Google sign-in was cancelled.',
      }
      setError(messages[oauthError] ?? `Sign-in failed: ${oauthError}`)
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const handleGoogle = () => {
    // createOAuth2Token sends userId+secret back in the URL — works on localhost (no cookie issues)
    account.createOAuth2Token(
      'google',
      `${window.location.origin}/login?provider=oauth`,
      `${window.location.origin}/login?error=user_oauth2_cancelled`
    )
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Magic link auto-creates the account if it doesn't exist
      await account.createMagicURLToken(
        ID.unique(),
        email,
        `${window.location.origin}/login`
      )
      setMagicSent(true)
    } catch (e) {
      setError(e.message ?? 'Failed to send magic link.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await account.createEmailPasswordSession(email, password)
      const user = await account.get()
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e.message ?? 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await account.create(ID.unique(), email, password, name || undefined)
      // Auto sign-in after account creation
      await account.createEmailPasswordSession(email, password)
      const user = await account.get()
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e.message ?? 'Could not create account. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  // Full-screen loading spinner while processing a callback
  if (loading && new URLSearchParams(window.location.search).get('secret')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-3.5">
              <BarChart2 className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Event Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track events. Get AI summaries. Stay updated.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-5 shadow-sm">

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogle}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground bg-card">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Method tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {[
              { id: 'magic', label: 'Magic Link' },
              { id: 'password', label: 'Email + Password' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setError(''); setMagicSent(false); setMode('signin') }}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${
                  tab === t.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Magic Link — works for both new and existing accounts */}
          {tab === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-3">
              {magicSent ? (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-400 text-center leading-relaxed">
                  Magic link sent to <strong>{email}</strong>.<br />
                  Check your inbox — link creates your account if new.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Magic Link'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    New here? Magic link creates your account automatically.
                  </p>
                </>
              )}
            </form>
          )}

          {/* Email + Password — sign in or create account */}
          {tab === 'password' && (
            <div className="space-y-3">
              {/* Sign in / Create account toggle */}
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                {[
                  { id: 'signin', label: 'Sign In' },
                  { id: 'signup', label: 'Create Account' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMode(m.id); setError('') }}
                    className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                      mode === m.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
                {mode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="password"
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  placeholder={mode === 'signup' ? 'Password (min 8 chars)' : 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                    : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                </Button>
              </form>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
