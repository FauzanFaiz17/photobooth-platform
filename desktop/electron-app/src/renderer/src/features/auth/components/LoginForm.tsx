import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import CardBody from '@/components/ui/CardBody'
import CardFooter from '@/components/ui/CardFooter'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Alert from '@/components/ui/Alert'
import { getApiErrorMessage } from '@/api/axios'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { NeoButton } from '@/components/shared/button'

interface LoginFormProps {
  initialMessage?: string
}

export default function LoginForm({ initialMessage }: LoginFormProps): JSX.Element {
  const { loading, handleLogin } = useLogin()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialMessage ?? null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    try {
      await handleLogin(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login gagal. Periksa email dan password.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex justify-center items-center">
      {/* CARD: Border tebal, warna surface, dan shadow variabel neo */}
      <div className="rounded-none">

        {/* CARD BODY: Layouting form dengan jarak (gap) yang solid */}
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label className="font-bold text-[var(--foreground)] uppercase tracking-wide text-sm">
              Email
            </Label>
            
            {/* INPUT: Solid shadow, efek 'ditekan' saat focus */}
            <Input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-[3px] border-[var(--border)] p-3 text-[var(--foreground)] font-semibold shadow-[4px_4px_0_0_var(--border)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_var(--border)] transition-all rounded-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-bold text-(--foreground) uppercase tracking-wide text-sm">
              Password
            </Label>
            
            <Input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border-[3px] border-(--border) p-3 text-(--foreground) font-semibold shadow-[4px_4px_0_0_var(--border)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_var(--border)] transition-all rounded-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>

        {/* CARD FOOTER: Memisahkan seksi tombol dengan border atas tebal */}
        <div className="p-6 flex flex-col gap-4">
          
          {/* ALERT: Background merah (danger), teks kontras, dan shadow hard */}
          {error && (
            <Alert 
              type="error" 
              className="bg-[var(--danger)] text-white border-[3px] border-[var(--border)] shadow-[4px_4px_0_0_var(--border)] p-3 font-bold rounded-none w-full text-center"
            >
              {error}
            </Alert>
          )}

          {/* BUTTON: Efek translate ekstrem (-7px) saat di-klik agar shadow-neo menghilang pas (seperti tombol arcade ditekan) */}
          <NeoButton 
            loading={loading} 
            type="submit" 
            variant='primary'
            className='w-full'
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </NeoButton>
        </div>
      </div>
    </form>
  )
}