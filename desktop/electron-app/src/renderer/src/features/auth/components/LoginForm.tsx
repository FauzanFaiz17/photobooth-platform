import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CardHeader from '@/components/ui/CardHeader'
import CardBody from '@/components/ui/CardBody'
import CardFooter from '@/components/ui/CardFooter'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Alert from '@/components/ui/Alert'
import { getApiErrorMessage } from '@/api/axios'

import { useLogin } from '@/features/auth/hooks/useLogin'

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
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-md">
        <CardHeader>Login</CardHeader>

        <CardBody>
          <div>
            <Label>Email</Label>

            <Input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Password</Label>

            <Input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardBody>

        <CardFooter>
          {error && <Alert type="error">{error}</Alert>}

          <Button loading={loading} type="submit" className="w-full">
            Masuk
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
