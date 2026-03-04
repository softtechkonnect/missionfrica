import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type') // email confirmation, recovery, etc.

  // Handle error from Supabase (e.g., expired link)
  if (error) {
    // Check if the error is about an already used link
    if (error === 'access_denied' && errorDescription?.includes('already')) {
      // Link already used - user can just sign in
      return NextResponse.redirect(`${origin}/auth/login?message=Email already confirmed. Please sign in.`)
    }
    
    const errorUrl = new URL(`${origin}/auth/auth-code-error`)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError, data: sessionData } = await supabase.auth.exchangeCodeForSession(code)
    
    // If exchange fails, handle gracefully
    if (exchangeError) {
      console.log("Exchange error:", exchangeError.message)
      
      // Check if user is already authenticated
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      if (existingUser) {
        // User is already authenticated, just redirect to dashboard
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      
      // PKCE error or already used - this commonly happens with email confirmation
      // The email is likely confirmed, so redirect to login with success message
      if (exchangeError.message?.includes('PKCE') || 
          exchangeError.message?.includes('code verifier') ||
          exchangeError.message?.includes('already') || 
          exchangeError.message?.includes('expired')) {
        return NextResponse.redirect(`${origin}/auth/login?message=Email confirmed! Please sign in to continue.`)
      }
    }
    
    if (!exchangeError) {
      // Check if user is a missionary and needs to complete profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        let { data: userData } = await supabase
          .from('users')
          .select('role, account_status')
          .eq('id', user.id)
          .single()

        // If no user record exists, create it (fallback for failed trigger)
        if (!userData) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: user.user_metadata?.role || 'donor',
              account_status: 'pending',
              email_verified: true,
            })
            .select('role, account_status')
            .single()
          
          userData = newUser
        }

        // If missionary with pending status, redirect to onboarding
        if (userData?.role === 'missionary' && userData?.account_status === 'pending') {
          const { data: profile } = await supabase
            .from('missionary_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()

          // No profile yet, redirect to onboarding
          if (!profile) {
            return NextResponse.redirect(`${origin}/missionary/onboarding`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
