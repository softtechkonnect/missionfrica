import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { PostCard, type Post } from "@/components/post-feed"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MapPin, 
  Building2, 
  CheckCircle, 
  Heart,
  Calendar,
  FileText,
  ArrowLeft
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

interface MissionaryPageProps {
  params: { id: string }
}

async function getMissionary(id: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from("missionary_profiles")
    .select(`
      id,
      bio,
      organization_name,
      organization_type,
      mission_country,
      mission_description,
      years_in_mission,
      created_at,
      users!inner (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("id", id)
    .single()

  return profile
}

async function getMissionaryPosts(missionaryId: string): Promise<Post[]> {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      missionary_profiles!inner (
        id,
        organization_name,
        mission_country,
        users!inner (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("missionary_id", missionaryId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (!posts) return []

  return posts.map((post: any) => {
    const profile = post.missionary_profiles
    const user = Array.isArray(profile.users) ? profile.users[0] : profile.users
    
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      missionary: {
        id: profile.id,
        full_name: user?.full_name || "Missionary",
        avatar_url: user?.avatar_url,
        location: profile.mission_country || "Africa",
        organization: profile.organization_name || "",
        is_verified: true,
      },
    }
  })
}

export async function generateMetadata({ params }: MissionaryPageProps): Promise<Metadata> {
  const missionary = await getMissionary(params.id)
  
  if (!missionary) {
    return {
      title: "Missionary Not Found",
    }
  }

  const user = Array.isArray(missionary.users) ? missionary.users[0] : missionary.users

  return {
    title: `${user?.full_name || "Missionary"} - Support Their Mission`,
    description: missionary.bio || missionary.mission_description || `Support ${user?.full_name}'s mission work in ${missionary.mission_country}`,
    openGraph: {
      title: `${user?.full_name} | MissionFrica`,
      description: missionary.bio || `Support ${user?.full_name}'s mission work`,
      images: user?.avatar_url ? [{ url: user.avatar_url }] : [],
    },
  }
}

export default async function MissionaryPage({ params }: MissionaryPageProps) {
  const missionary = await getMissionary(params.id)
  
  if (!missionary) {
    notFound()
  }

  const posts = await getMissionaryPosts(params.id)
  const user = Array.isArray(missionary.users) ? missionary.users[0] : missionary.users

  const joinDate = new Date(missionary.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-faith-600 to-faith-700 py-12">
        <div className="container mx-auto px-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-lg">
              <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
              <AvatarFallback className="text-3xl bg-faith-100 text-faith-700">
                {user?.full_name?.split(" ").map((n: string) => n[0]).join("") || "M"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {user?.full_name || "Missionary"}
                </h1>
                <Badge className="bg-green-500 text-white gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-faith-100 mb-4">
                {missionary.mission_country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{missionary.mission_country}</span>
                  </div>
                )}
                {missionary.organization_name && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{missionary.organization_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {joinDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{posts.length} {posts.length === 1 ? "Post" : "Posts"}</span>
                </div>
              </div>
              
              {missionary.bio && (
                <p className="text-faith-100 max-w-2xl">
                  {missionary.bio}
                </p>
              )}
            </div>

            <div className="md:self-start">
              <Link href={`/donate/${params.id}`}>
                <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                  <Heart className="h-5 w-5" />
                  Support This Missionary
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Posts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mission Description Card */}
            {missionary.mission_description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-3">About the Mission</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {missionary.mission_description}
                  </p>
                  {missionary.years_in_mission && (
                    <p className="text-sm text-gray-500 mt-3">
                      Serving in missions for {missionary.years_in_mission} years
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Updates from {user?.full_name?.split(" ")[0] || "the Missionary"}
              </h2>
              
              {posts.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">No Posts Yet</h3>
                  <p className="text-gray-500">
                    This missionary hasn&apos;t shared any updates yet. Check back soon!
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Support CTA Card */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="pt-6 text-center">
                  <Heart className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-amber-900 mb-2">
                    Partner with {user?.full_name?.split(" ")[0] || "this Missionary"}
                  </h3>
                  <p className="text-sm text-amber-700 mb-4">
                    Your support helps spread the Gospel in {missionary.mission_country || "Africa"}.
                  </p>
                  <Link href={`/donate/${params.id}`}>
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 gap-2">
                      <Heart className="h-4 w-4" />
                      Support This Missionary
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Sidebar />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
