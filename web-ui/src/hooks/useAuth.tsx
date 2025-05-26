import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../utils/supabase'

interface AuthContextType {
  user: any
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check for session in localStorage
    const session = localStorage.getItem('sb-session')
    if (session) {
      setUser(JSON.parse(session))
    }
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((
      _event: string, session: any
    ) => {
      if (session?.user) {
        setUser(session.user)
        localStorage.setItem('sb-session', JSON.stringify(session.user))
      } else {
        setUser(null)
        localStorage.removeItem('sb-session')
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (data?.user) {
      setUser(data.user)
      localStorage.setItem('sb-session', JSON.stringify(data.user))
    }
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      email_confirm: true,
      options: {
        data: { role: 'vendor' }
      }
    })
    if (!error) {
      // Immediately sign in after successful registration
      return await signIn(email, password)
    }
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('sb-session')
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 