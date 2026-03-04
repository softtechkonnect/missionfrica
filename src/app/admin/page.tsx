"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  FileText, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Shield,
  Loader2
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Stats {
  totalUsers: number
  pendingMissionaries: number
  approvedMissionaries: number
  pendingPosts: number
  pendingWithdrawals: number
  totalDonations: number
  totalFees: number
}

interface PendingMissionary {
  id: string
  full_name: string
  email: string
  created_at: string
  missionary_profiles: { organization_name: string; mission_location: string }[]
}

interface PendingPost {
  id: string
  title: string
  created_at: string
  missionary_profiles: { users: { full_name: string } }
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentPendingMissionaries, setRecentPendingMissionaries] = useState<PendingMissionary[]>([])
  const [recentPendingPosts, setRecentPendingPosts] = useState<PendingPost[]>([])

  useEffect(() => {
    async function loadAdminData() {
      try {
        const supabase = createClient()
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        console.log("[Admin] User data:", userData, userError?.message)

        // If RLS is blocking, check metadata instead
        let isAdmin = userData?.role === "admin"
        if (userError?.message?.includes("permission denied")) {
          console.log("[Admin] RLS blocking, checking metadata")
          isAdmin = user.user_metadata?.role === "admin"
        }

        if (!isAdmin) {
          setError("Access denied. You must be an admin to view this page.")
          setTimeout(() => {
            window.location.href = "/dashboard"
          }, 2000)
          return
        }

        // Load stats - wrap in try-catch to handle RLS errors
        let totalUsers = 0, pendingMissionaries = 0, approvedMissionaries = 0
        let pendingPosts = 0, pendingWithdrawals = 0, totalDonations = 0, totalFees = 0

        try {
          const { count, error } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
          if (!error) totalUsers = count || 0
        } catch (e) { console.log("Error fetching totalUsers") }

        try {
          const { count, error } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "missionary")
            .in("account_status", ["under_review", "pending"])
          if (!error) pendingMissionaries = count || 0
        } catch (e) { console.log("Error fetching pendingMissionaries") }

        try {
          const { count, error } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "missionary")
            .eq("account_status", "approved")
          if (!error) approvedMissionaries = count || 0
        } catch (e) { console.log("Error fetching approvedMissionaries") }

        try {
          const { count, error } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending_review")
          if (!error) pendingPosts = count || 0
        } catch (e) { console.log("Error fetching pendingPosts") }

        try {
          const { count, error } = await supabase
            .from("withdrawals")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
          if (!error) pendingWithdrawals = count || 0
        } catch (e) { console.log("Error fetching pendingWithdrawals") }

        try {
          const { data: donationStats, error } = await supabase
            .from("donations")
            .select("amount, platform_fee")
            .eq("status", "completed")
          if (!error && donationStats) {
            totalDonations = donationStats.reduce((sum, d) => sum + d.amount, 0)
            totalFees = donationStats.reduce((sum, d) => sum + d.platform_fee, 0)
          }
        } catch (e) { console.log("Error fetching donations") }

        setStats({
          totalUsers,
          pendingMissionaries,
          approvedMissionaries,
          pendingPosts,
          pendingWithdrawals,
          totalDonations,
          totalFees,
        })

        // Load pending missionaries - use explicit relationship hint
        try {
          const { data: missionaries, error } = await supabase
            .from("users")
            .select(`
              id,
              full_name,
              email,
              created_at,
              missionary_profiles!missionary_profiles_user_id_fkey (
                organization_name,
                mission_location
              )
            `)
            .eq("role", "missionary")
            .in("account_status", ["under_review", "pending"])
            .order("created_at", { ascending: false })
            .limit(5)

          if (!error) setRecentPendingMissionaries(missionaries as any || [])
        } catch (e) { console.log("Error fetching pending missionaries") }

        // Load pending posts - use explicit relationship hint
        try {
          const { data: posts, error } = await supabase
            .from("posts")
            .select(`
              id,
              title,
              created_at,
              missionary_id
            `)
            .eq("status", "pending_review")
            .order("created_at", { ascending: false })
            .limit(5)

          if (!error) setRecentPendingPosts(posts as any || [])
        } catch (e) { console.log("Error fetching pending posts") }
        setIsLoading(false)
      } catch (err: any) {
        console.error("[Admin] Error:", err)
        setError(err?.message || "Failed to load admin dashboard")
        setIsLoading(false)
      }
    }

    loadAdminData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-faith-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-faith-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage missionaries, posts, and platform settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/audit-logs">
              <Button variant="outline">Audit Logs</Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.href = "/auth/login"
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {stats && ((stats.pendingMissionaries || 0) > 0 || (stats.pendingPosts || 0) > 0 || (stats.pendingWithdrawals || 0) > 0) && (
          <Card className="mb-6 border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Items Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {(stats.pendingMissionaries || 0) > 0 && (
                  <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                    {stats.pendingMissionaries} missionary profiles pending review
                  </Badge>
                )}
                {(stats.pendingPosts || 0) > 0 && (
                  <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                    {stats.pendingPosts} posts pending review
                  </Badge>
                )}
                {(stats.pendingWithdrawals || 0) > 0 && (
                  <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                    {stats.pendingWithdrawals} withdrawals pending approval
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-faith-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Missionaries</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approvedMissionaries || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalDonations || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Platform Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-faith-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalFees || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Link href="/admin/missionaries">
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <Users className="h-8 w-8 text-faith-600" />
                <div>
                  <p className="font-semibold">Manage Missionaries</p>
                  <p className="text-sm text-gray-500">Review and approve profiles</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/posts">
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-faith-600" />
                <div>
                  <p className="font-semibold">Manage Posts</p>
                  <p className="text-sm text-gray-500">Review and approve posts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/withdrawals">
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <DollarSign className="h-8 w-8 text-faith-600" />
                <div>
                  <p className="font-semibold">Withdrawals</p>
                  <p className="text-sm text-gray-500">Approve withdrawal requests</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/donations">
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <TrendingUp className="h-8 w-8 text-faith-600" />
                <div>
                  <p className="font-semibold">Donations</p>
                  <p className="text-sm text-gray-500">View all donations</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Content Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/blog">
            <Card className="hover:shadow-md transition cursor-pointer border-faith-200">
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold">Manage Blog</p>
                  <p className="text-sm text-gray-500">Create and edit blog posts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/news">
            <Card className="hover:shadow-md transition cursor-pointer border-faith-200">
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold">Manage News</p>
                  <p className="text-sm text-gray-500">Create and edit news articles</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/settings">
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <Shield className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="font-semibold">Settings</p>
                  <p className="text-sm text-gray-500">Platform configuration</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Missionaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Missionary Reviews
              </CardTitle>
              <CardDescription>Missionaries awaiting profile approval</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPendingMissionaries && recentPendingMissionaries.length > 0 ? (
                <div className="space-y-4">
                  {recentPendingMissionaries.map((missionary: any) => (
                    <div key={missionary.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{missionary.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {missionary.missionary_profiles?.[0]?.organization_name || "No org"} • {missionary.missionary_profiles?.[0]?.mission_location || "Unknown"}
                        </p>
                      </div>
                      <Link href={`/admin/missionaries/${missionary.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  ))}
                  <Link href="/admin/missionaries?status=under_review">
                    <Button variant="outline" className="w-full">View All Pending</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No pending reviews</p>
              )}
            </CardContent>
          </Card>

          {/* Pending Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-500" />
                Pending Post Reviews
              </CardTitle>
              <CardDescription>Posts awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPendingPosts && recentPendingPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPendingPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-gray-500">
                          Post ID: {post.id.slice(0, 8)}...
                        </p>
                      </div>
                      <Link href={`/admin/posts/${post.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  ))}
                  <Link href="/admin/posts?status=pending_review">
                    <Button variant="outline" className="w-full">View All Pending</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No pending posts</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
