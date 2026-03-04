import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Heart, 
  Users, 
  TrendingUp,
  Calendar,
  ArrowRight
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function DonorDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "donor") {
    redirect("/dashboard")
  }

  // Get donation history
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      id,
      amount,
      created_at,
      missionary_profiles (
        id,
        organization_name,
        users (
          full_name,
          avatar_url
        )
      )
    `)
    .eq("donor_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5)

  // Calculate stats
  const totalDonated = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0
  const missionariesSupported = new Set(donations?.map(d => (d.missionary_profiles as any)?.id)).size

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userData.avatar_url || undefined} />
              <AvatarFallback className="bg-faith-600 text-white text-xl">
                {userData.full_name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userData.full_name?.split(" ")[0] || "Friend"}!
              </h1>
              <p className="text-gray-600">Thank you for supporting missionaries across Africa</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Donated</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-faith-600">{formatCurrency(totalDonated)}</div>
              <p className="text-xs text-gray-500">Making a difference</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Missionaries Supported</CardTitle>
              <Users className="h-4 w-4 text-faith-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{missionariesSupported}</div>
              <p className="text-xs text-gray-500">Across Africa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Donations Made</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donations?.length || 0}</div>
              <p className="text-xs text-gray-500">Contributions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Your latest contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {donations && donations.length > 0 ? (
                <div className="space-y-4">
                  {donations.map((donation: any) => {
                    const profile = donation.missionary_profiles
                    const missionaryUser = Array.isArray(profile?.users) 
                      ? profile?.users[0] 
                      : profile?.users
                    
                    return (
                      <div key={donation.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={missionaryUser?.avatar_url} />
                            <AvatarFallback className="bg-faith-100 text-faith-600">
                              {missionaryUser?.full_name?.charAt(0) || "M"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{missionaryUser?.full_name || "Missionary"}</p>
                            <p className="text-sm text-gray-500">{profile?.organization_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-faith-600">{formatCurrency(donation.amount)}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(donation.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You haven't made any donations yet</p>
                  <Link href="/feed">
                    <Button>Discover Missionaries</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>What would you like to do?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/feed" className="block">
                <div className="flex items-center justify-between p-4 bg-faith-50 rounded-lg hover:bg-faith-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-faith-600 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Browse Feed</p>
                      <p className="text-sm text-gray-500">See latest missionary updates</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link href="/missionaries" className="block">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Find Missionaries</p>
                      <p className="text-sm text-gray-500">Discover who to support</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>

              <Link href="/blog" className="block">
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-600 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Read Blog</p>
                      <p className="text-sm text-gray-500">Stories and updates</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
