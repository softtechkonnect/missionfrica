"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Heart, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [email, setEmail] = useState("")

  const isExpiredLink = error === "access_denied" || errorDescription?.includes("expired")

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage("Please enter your email address")
      return
    }
    
    setResendLoading(true)
    setResendMessage(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })
      
      if (error) {
        setResendMessage(error.message)
      } else {
        setResendMessage("Verification email sent! Please check your inbox.")
      }
    } catch (err) {
      setResendMessage("Failed to resend verification email")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-faith-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-faith-600" />
            <span className="text-xl font-bold text-faith-900">Mission<span className="text-amber-600">Frica</span></span>
          </Link>
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
          <CardDescription>
            {errorDescription 
              ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
              : "There was a problem verifying your email. The link may have expired or already been used."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExpiredLink && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Enter your email to receive a new verification link:
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-faith-500"
              />
              <Button 
                onClick={handleResendVerification} 
                disabled={resendLoading}
                className="w-full"
                variant="outline"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              {resendMessage && (
                <p className={`text-sm text-center ${resendMessage.includes("sent") ? "text-green-600" : "text-red-600"}`}>
                  {resendMessage}
                </p>
              )}
            </div>
          )}
          <p className="text-center text-gray-600 text-sm">
            Or try signing in directly if you've already verified your email.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline">Register</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-faith-600 border-t-transparent rounded-full" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
