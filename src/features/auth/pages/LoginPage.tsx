// src/features/auth/pages/LoginPage.tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import http from '@/lib/http'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { TOKEN_KEY } from '@/lib/http';

type FromState = { from?: { pathname: string } }

const schema = z.object({
  email: z.string().min(1, 'Requerido'),
  password: z.string().min(5, 'Mínimo 5 caracteres'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const nav = useNavigate()
  const location = useLocation()

  // 👇 define "from" para pasar al registro
 const from =
  (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    const res = await http.post('/auth/login', data)
    const { token, rol, branchId, businessType, email, username } = res.data 
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('rol', rol)
    localStorage.setItem('email', email)
    localStorage.setItem('username', username)
    if (branchId) localStorage.setItem('branchId', String(branchId))
    if (businessType) localStorage.setItem('businessType', String(businessType))

    const goTo = (location.state as FromState | null)?.from?.pathname ?? '/'
    nav(goTo, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md p-6 bg-white rounded-2xl shadow-soft w-full">
        <h1 className="text-2xl font-semibold mb-4 text-center">Iniciar sesión</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Usuario</label>
            <input className="w-full border rounded-xl px-3 py-2" {...register('email')} />
            {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input type="password" className="w-full border rounded-xl px-3 py-2" {...register('password')} />
            {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>

          {/* Enlace al registro */}
         <p className="text-sm text-center">
            ¿No tienes cuenta?{' '}
            <Link to="/register" state={{ from }} className="text-blue-600 underline">
              Crear cuenta
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
