import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../features/auth/services/authService'
import { useAuthStore } from '../features/auth/store/authStore'

interface LoginLocationState { from?: { pathname?: string } }

function getLoginError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status && [400, 401, 403, 422].includes(status)) {
      return 'Usuario o contraseña incorrectos.'
    }
    if (!error.response || (status && status >= 500)) {
      return 'No fue posible conectar con el servicio. Intenta nuevamente.'
    }
  }
  return 'No fue posible iniciar sesión. Intenta nuevamente.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const startSession = useAuthStore((state) => state.startSession)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await login({ username, password })
      startSession(response)
      const state = location.state as LoginLocationState | null
      navigate(state?.from?.pathname || '/dashboard', { replace: true })
    } catch (requestError) {
      setError(getLoginError(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='login-page'>
      <section className='login-intro' aria-label='OBI Smart Retail'>
        <div className='login-brand'>
          <div className='login-brand-mark'>M</div>
          <div><strong>MAREA</strong><span>Hipermercados</span></div>
        </div>
        <div className='login-intro-content'>
          <span className='login-kicker'><Sparkles size={15} /> OBI Smart Retail</span>
          <h1>Decisiones de inventario más inteligentes.</h1>
          <p>Accede al centro operativo para revisar pedidos, anticipar la demanda y proteger la disponibilidad de cada tienda.</p>
          <ul>
            <li><ShieldCheck size={18} /> Acceso seguro a información operativa</li>
            <li><Sparkles size={18} /> Recomendaciones impulsadas por OBI AI</li>
          </ul>
        </div>
        <small>OBI Smart · Grupo 12 · 2026</small>
      </section>
      <section className='login-form-section'>
        <div className='login-form-wrap'>
          <div className='login-mobile-brand'>
            <div className='login-brand-mark'>M</div><strong>MAREA</strong>
          </div>
          <div className='login-heading'>
            <span className='login-icon'><LockKeyhole size={22} /></span>
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales para acceder al panel.</p>
          </div>

          <form className='login-form' onSubmit={handleSubmit} noValidate>
            <label htmlFor='username'>Usuario</label>
            <div className='login-input'>
              <UserRound size={18} aria-hidden='true' />
              <input
                id='username'
                name='username'
                type='text'
                autoComplete='username'
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder='Ingresa tu usuario'
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
              />
            </div>

            <label htmlFor='password'>Contraseña</label>
            <div className='login-input'>
              <LockKeyhole size={18} aria-hidden='true' />
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='Ingresa tu contraseña'
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
              />
              <button
                className='password-toggle'
                type='button'
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <div className='login-error' role='alert'>{error}</div>}
            <button className='login-submit' type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? <><LoaderCircle className='spin' size={18} /> Validando acceso...</>
                : <>Ingresar al panel <ArrowRight size={18} /></>}
            </button>
          </form>
          <p className='login-security'><ShieldCheck size={15} /> Conexión protegida y sesión temporal</p>
        </div>
      </section>
    </main>
  )
}
