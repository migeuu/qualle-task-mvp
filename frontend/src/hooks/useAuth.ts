import { create } from 'zustand'
import type { User, LoginInput, RegisterInput } from '../types'
import { gqlRequest } from '../lib/graphql'
import { getToken, setToken, removeToken } from '../lib/auth'
import { disconnectSocket } from '../lib/socket'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuth = create<AuthState>()((set) => {
  const token = getToken()

  return {
    user: null,
    token,
    isLoading: !!token,

    login: async (input: LoginInput) => {
      const data = await gqlRequest<{
        login: { accessToken: string; user: User }
      }>(
        `mutation Login($input: LoginInput!) {
          login(input: $input) {
            accessToken
            user { id name email }
          }
        }`,
        { input },
      )
      setToken(data.login.accessToken)
      set({ user: data.login.user, token: data.login.accessToken })
    },

    register: async (input: RegisterInput) => {
      const data = await gqlRequest<{
        register: { accessToken: string; user: User }
      }>(
        `mutation Register($input: RegisterInput!) {
          register(input: $input) {
            accessToken
            user { id name email }
          }
        }`,
        { input },
      )
      setToken(data.register.accessToken)
      set({ user: data.register.user, token: data.register.accessToken })
    },

    logout: () => {
      removeToken()
      disconnectSocket()
      set({ user: null, token: null })
    },

    fetchMe: async () => {
      try {
        const data = await gqlRequest<{ me: User }>(`
          query Me {
            me { id email name createdAt updatedAt }
          }
        `)
        set({ user: data.me, isLoading: false })
      } catch {
        removeToken()
        set({ user: null, token: null, isLoading: false })
      }
    },
  }
})

const initialState = useAuth.getState()
if (initialState.token) {
  initialState.fetchMe()
}
