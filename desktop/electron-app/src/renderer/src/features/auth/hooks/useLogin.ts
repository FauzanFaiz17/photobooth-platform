import { useState } from 'react'

import { authService } from '../services/authService'

export function useLogin() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async (
    email: string,

    password: string
  ) => {
    setLoading(true)

    try {
      return await authService.login({
        email,

        password
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,

    handleLogin
  }
}
