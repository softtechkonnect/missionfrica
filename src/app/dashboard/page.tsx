"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Checking authentication...")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        const supabase = createClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log("[Dashboard] Auth check:", { userId: user?.id, email: user?.email, error: userError?.message })
        
        if (!user) {
          console.log("[Dashboard] No user found, redirecting to login")
          setStatus("Not authenticated. Redirecting to login...")
          window.location.href = "/auth/login"
          return
        }

        setStatus(`Welcome ${user.email}! Loading your dashboard...`)

        let { data: userData, error: dbError } = await supabase
          .from("users")
          .select("role, account_status, full_name")
          .eq("id", user.id)
          .single()
        
        console.log("[Dashboard] User data from DB:", { userData, dbError: dbError?.message })

        // If RLS is blocking, use metadata as fallback
        if (dbError?.message?.includes("permission denied")) {
          console.log("[Dashboard] RLS blocking, using metadata fallback")
          const role = user.user_metadata?.role || "donor"
          const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
          
          // Redirect based on metadata role
          switch (role) {
            case "admin":
              window.location.href = "/admin"
              return
            case "missionary":
              window.location.href = "/missionary/onboarding"
              return
            default:
              window.location.href = "/donor/dashboard"
              return
          }
        }

        // If user record doesn't exist, create it (fallback for failed trigger)
        if (!userData) {
          setStatus("Setting up your account...")
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email || "",
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
              role: user.user_metadata?.role || "donor",
              account_status: "pending",
              email_verified: true,
            })
            .select("role, account_status, full_name")
            .single()

          if (insertError || !newUser) {
            // If insert also fails due to RLS, use metadata fallback
            if (insertError?.message?.includes("permission denied")) {
              const role = user.user_metadata?.role || "donor"
              switch (role) {
                case "admin":
                  window.location.href = "/admin"
                  return
                case "missionary":
                  window.location.href = "/missionary/onboarding"
                  return
                default:
                  window.location.href = "/donor/dashboard"
                  return
              }
            }
            setError(`Account setup error: ${insertError?.message || "Unknown error"}`)
            return
          }
          userData = newUser
        }

        // Redirect based on role
        setStatus(`Redirecting to ${userData.role} dashboard...`)
        
        switch (userData.role) {
          case "admin":
            window.location.href = "/admin"
            break
          case "missionary":
            // Check if profile exists
            const { data: profile } = await supabase
              .from("missionary_profiles")
              .select("id")
              .eq("user_id", user.id)
              .single()
            
            if (!profile) {
              window.location.href = "/missionary/onboarding"
            } else if (userData.account_status === "under_review" || userData.account_status === "pending") {
              // Show under review message instead of redirecting
              setStatus("under_review")
              setIsLoading(false)
              return
            } else if (userData.account_status === "rejected") {
              setStatus("rejected")
              setIsLoading(false)
              return
            } else if (userData.account_status === "suspended") {
              setStatus("suspended")
              setIsLoading(false)
              return
            } else {
              window.location.href = "/missionary/dashboard"
            }
            break
          case "donor":
          default:
            window.location.href = "/donor/dashboard"
            break
        }
      } catch (err: any) {
        console.error("[Dashboard] Error:", err)
        setError(`Error: ${err?.message || "Unknown error"}`)
      }
    }

    checkAuthAndRedirect()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  // Show under review message for missionaries
  if (status === "under_review") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-faith-50 to-white">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Under Review</h1>
          <p className="text-gray-600 mb-6">
            Your missionary profile is currently being reviewed by our admin team. 
            This typically takes 1-3 business days. You will receive an email once your account is approved.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Our team will verify your information</li>
              <li>• You'll receive an email when approved</li>
              <li>• Once approved, you can start posting and receiving donations</li>
            </ul>
          </div>
          <button 
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = "/auth/login"
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Show rejected message
  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h1>
          <p className="text-gray-600 mb-6">
            Unfortunately, your missionary application was not approved. 
            Please contact support for more information.
          </p>
          <a href="mailto:support@missionfrica.com" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  // Show suspended message
  if (status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
          <p className="text-gray-600 mb-6">
            Your account has been suspended. Please contact support for assistance.
          </p>
          <a href="mailto:support@missionfrica.com" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-faith-600 mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
