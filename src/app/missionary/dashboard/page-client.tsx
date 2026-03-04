"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertCircle,
  Plus,
  CreditCard,
  TrendingUp,
  Loader2,
  LogOut
} from "lucide-react"
import { formatCurrency, getAccountStatusColor } from "@/lib/utils"

interface UserData {
  id: string
  full_name: string
  email: string
  role: string
  account_status: string
}

interface ProfileData {
  id: string
  total_raised: number
  stripe_onboarding_complete: boolean
  rejection_reason?: string
}

export default function MissionaryDashboardClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState({
    totalPosts: 0,
    approvedPosts: 0,
    pendingPosts: 0,
    availableBalance: 0,
    pendingBalance: 0
  })
  const [recentDonations, setRecentDonations] = useState<any[]>([])

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        // Get user data
        const { data: userDataResult, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        if (userError || !userDataResult) {
          // Try using metadata
          const role = user.user_metadata?.role
          if (role !== "missionary") {
            window.location.href = "/dashboard"
            return
          }
          setError("Unable to load user data. Please try again.")
          setIsLoading(false)
          return
        }

        if (userDataResult.role !== "missionary") {
          window.location.href = "/dashboard"
          return
        }

        setUserData(userDataResult as UserData)

        // Check account status - redirect if not approved
        if (userDataResult.account_status === "under_review" || userDataResult.account_status === "pending") {
          window.location.href = "/dashboard"
          return
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("missionary_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profileError || !profileData) {
          window.location.href = "/missionary/onboarding"
          return
        }

        setProfile(profileData as ProfileData)

        // Get posts count
        const { count: totalPosts } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("missionary_id", profileData.id)

        const { count: approvedPosts } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("missionary_id", profileData.id)
          .eq("status", "approved")

        const { count: pendingPosts } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("missionary_id", profileData.id)
          .eq("status", "pending_review")

        // Get balances
        const { data: availableBalance } = await supabase.rpc("get_available_balance", {
          p_missionary_id: profileData.id
        })

        const { data: pendingBalance } = await supabase.rpc("get_pending_balance", {
          p_missionary_id: profileData.id
        })

        setStats({
          totalPosts: totalPosts || 0,
          approvedPosts: approvedPosts || 0,
          pendingPosts: pendingPosts || 0,
          availableBalance: availableBalance || 0,
          pendingBalance: pendingBalance || 0
        })

        // Get recent donations
        const { data: donations } = await supabase
          .from("donations")
          .select("*")
          .eq("missionary_id", profileData.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(5)

        setRecentDonations(donations || [])
        setIsLoading(false)

      } catch (err: any) {
        console.error("Dashboard error:", err)
        setError(err?.message || "Failed to load dashboard")
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-faith-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !userData || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Failed to load dashboard"}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    )
  }

  const statusMessages: Record<string, { title: string; description: string; variant: "warning" | "info" | "success" | "destructive" }> = {
    pending: {
      title: "Profile Pending",
      description: "Please complete your missionary profile to start receiving donations.",
      variant: "warning"
    },
    under_review: {
      title: "Under Review",
      description: "Your profile is being reviewed by our team. This usually takes 1-3 business days.",
      variant: "info"
    },
    approved: {
      title: "Profile Approved",
      description: "Your profile is live and you can receive donations.",
      variant: "success"
    },
    rejected: {
      title: "Profile Rejected",
      description: profile.rejection_reason || "Your profile was rejected. Please contact support.",
      variant: "destructive"
    },
    suspended: {
      title: "Account Suspended",
      description: "Your account has been suspended. Please contact support.",
      variant: "destructive"
    }
  }

  const currentStatus = statusMessages[userData.account_status] || statusMessages.pending

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Missionary Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userData.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getAccountStatusColor(userData.account_status)}>
              {userData.account_status.replace("_", " ")}
            </Badge>
            <Link href="/missionary/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {userData.account_status !== "approved" && (
          <Card className={`mb-6 border-l-4 ${
            currentStatus.variant === "warning" ? "border-l-yellow-500" :
            currentStatus.variant === "info" ? "border-l-blue-500" :
            currentStatus.variant === "destructive" ? "border-l-red-500" :
            "border-l-green-500"
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {currentStatus.variant === "warning" && <Clock className="h-5 w-5 text-yellow-500" />}
                {currentStatus.variant === "info" && <AlertCircle className="h-5 w-5 text-blue-500" />}
                {currentStatus.variant === "destructive" && <AlertCircle className="h-5 w-5 text-red-500" />}
                {currentStatus.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{currentStatus.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Raised</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(profile.total_raised)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-faith-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.availableBalance)}</div>
              {stats.pendingBalance > 0 && (
                <p className="text-sm text-gray-500">{formatCurrency(stats.pendingBalance)} pending</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Posts</CardTitle>
              <FileText className="h-4 w-4 text-faith-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedPosts} / 10</div>
              <Progress value={(stats.approvedPosts / 10) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPosts}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/missionary/posts/new" className="block">
                <Button className="w-full justify-start gap-2" disabled={userData.account_status !== "approved"}>
                  <Plus className="h-4 w-4" />
                  Create New Post
                </Button>
              </Link>
              <Link href="/missionary/withdraw" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  disabled={!profile.stripe_onboarding_complete || stats.availableBalance <= 0}
                >
                  <CreditCard className="h-4 w-4" />
                  Request Withdrawal
                </Button>
              </Link>
              {!profile.stripe_onboarding_complete && (
                <Link href="/missionary/stripe-onboarding" className="block">
                  <Button variant="secondary" className="w-full justify-start gap-2">
                    <CreditCard className="h-4 w-4" />
                    Complete Stripe Setup
                  </Button>
                </Link>
              )}
              <Link href="/missionary/posts" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Posts
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Your latest received donations</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDonations.length > 0 ? (
                <div className="space-y-4">
                  {recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {donation.is_anonymous ? "Anonymous" : donation.donor_name || "Guest"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(donation.net_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No donations yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
