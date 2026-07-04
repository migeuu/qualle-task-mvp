import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/Spinner'
import type { RegisterInput } from '../types'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(50),
})

export function RegisterPage() {
  const { register: registerUser, token, isLoading } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    if (!isLoading && token) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoading, token, navigate])

  const onSubmit = async (data: RegisterInput) => {
    setSubmitting(true)
    try {
      await registerUser(data)
      toast.success('Account created successfully')
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return <Spinner />
  }

  if (token) {
    return null
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Qualle Task</h1>
        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="name" style={styles.label}>Name</label>
            <input
              id="name"
              type="text"
              {...register('name')}
              style={styles.input}
              placeholder="Your name"
            />
            {errors.name && <span style={styles.error}>{errors.name.message}</span>}
          </div>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              style={styles.input}
              placeholder="you@example.com"
            />
            {errors.email && <span style={styles.error}>{errors.email.message}</span>}
          </div>
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              style={styles.input}
              placeholder="At least 6 characters"
            />
            {errors.password && <span style={styles.error}>{errors.password.message}</span>}
          </div>
          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login" style={styles.anchor}>Login</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
    background: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: '2rem',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#1a1a2e',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#333',
  },
  input: {
    padding: '0.625rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    fontSize: '0.8rem',
    color: '#e53e3e',
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: '#4f46e5',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  anchor: {
    color: '#4f46e5',
    fontWeight: 600,
    textDecoration: 'none',
  },
}
