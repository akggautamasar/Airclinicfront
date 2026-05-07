import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const publicRoutes = ['/login', '/signup']

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('clinic_token', session.access_token)
        if (publicRoutes.includes(router.pathname)) router.push('/dashboard')
      } else {
        localStorage.removeItem('clinic_token')
        if (!publicRoutes.includes(router.pathname)) router.push('/login')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('clinic_token', session.access_token)
      } else {
        localStorage.removeItem('clinic_token')
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <Component {...pageProps} />
}
