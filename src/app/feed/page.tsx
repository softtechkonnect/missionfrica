import { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { PostFeed, type Post } from "@/components/post-feed"
import { Badge } from "@/components/ui/badge"
import { Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Mission Feed - Latest Updates from Missionaries",
  description: "Scroll through the latest posts and updates from verified missionaries across Africa. Discover stories of faith, hope, and transformation.",
}

async function getApprovedPosts(): Promise<Post[]> {
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
    .limit(20)

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  if (!posts || posts.length === 0) return []

  // Get missionary profile IDs
  const missionaryIds = [...new Set(posts.map(p => p.missionary_id))]
  
  // Fetch missionary profiles
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

export default async function FeedPage() {
  const posts = await getApprovedPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feed Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mission Feed</h1>
                <p className="text-gray-600">Latest updates from missionaries across Africa</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                Live Updates
              </Badge>
            </div>

            <PostFeed posts={posts} hasMore={posts.length >= 20} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
