import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSlider } from "@/components/hero-slider"
import { Sidebar } from "@/components/sidebar"
import { PostFeed, type Post } from "@/components/post-feed"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Globe, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Heart
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getLatestPosts(): Promise<Post[]> {
  const supabase = await createClient()
  
  // First get approved posts
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      media_urls,
      created_at,
      missionary_id
    `)
    .eq("status", "approved")
    .eq("visible", true)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  if (!posts || posts.length === 0) return []

  // Get missionary profile IDs
  const missionaryIds = [...new Set(posts.map(p => p.missionary_id))]
  
  // Fetch missionary profiles with user info
  const { data: profiles } = await supabase
    .from("missionary_profiles")
    .select(`
      id,
      organization_name,
      mission_location,
      user_id
    `)
    .in("id", missionaryIds)

  // Fetch users for these profiles
  const userIds = profiles?.map(p => p.user_id) || []
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", userIds)

  // Create lookup maps
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const userMap = new Map(users?.map(u => [u.id, u]) || [])

  return posts.map((post: any) => {
    const profile = profileMap.get(post.missionary_id)
    const user = profile ? userMap.get(profile.user_id) : null
    
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      media_urls: post.media_urls || [],
      created_at: post.created_at,
      missionary: {
        id: profile?.id || post.missionary_id,
        full_name: user?.full_name || "Missionary",
        avatar_url: user?.avatar_url,
        location: profile?.mission_location || "Africa",
        organization: profile?.organization_name || "",
        is_verified: true,
      },
    }
  })
}

export default async function HomePage() {
  const posts = await getLatestPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feed Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card className="bg-gradient-to-r from-faith-600 to-faith-700 text-white border-0">
              <CardContent className="pt-6">
                <h1 className="text-2xl font-bold mb-2">
                  Welcome to MissionFrica
                </h1>
                <p className="text-faith-100 mb-4">
                  Scroll through updates from verified missionaries across Africa. 
                  Find a story that moves you and make a difference today.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/missionaries">
                    <Button variant="secondary" className="gap-2">
                      <Users className="h-4 w-4" />
                      Browse All Missionaries
                    </Button>
                  </Link>
                  <Link href="/auth/register?role=missionary">
                    <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-faith-700 gap-2">
                      Become a Missionary
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Post Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Latest Updates</h2>
                <Badge variant="secondary" className="gap-1">
                  <Globe className="h-3 w-3" />
                  From the Field
                </Badge>
              </div>
              <PostFeed posts={posts} />
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How MissionFrica Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A simple way to connect with and support missionaries across Africa
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Discover Missionaries",
                description: "Browse through verified missionary profiles and read their stories from the field."
              },
              {
                icon: Heart,
                title: "Support Their Mission",
                description: "Click 'Support This Missionary' to make a secure donation directly to their work."
              },
              {
                icon: Globe,
                title: "Follow Their Journey",
                description: "Stay updated with posts from the missionaries you support as they share their impact."
              }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-faith-100 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-faith-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-faith-900 rounded-2xl p-8 md:p-12 text-center text-white">
          <Shield className="h-12 w-12 mx-auto mb-4 text-faith-300" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Verified Missionaries Only</h2>
          <p className="text-faith-100 max-w-2xl mx-auto mb-6">
            Every missionary on MissionFrica goes through a thorough verification process 
            to ensure authenticity and accountability in their mission work.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Identity Verified</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Mission Authenticated</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
