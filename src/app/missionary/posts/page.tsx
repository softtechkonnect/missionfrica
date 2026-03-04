import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Plus, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar
} from "lucide-react"

const MAX_POSTS = 10

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>
    case "pending_review":
      return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function ManagePostsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("account_status")
    .eq("id", user.id)
    .single()

  const { data: profile } = await supabase
    .from("missionary_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    redirect("/missionary/onboarding")
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("missionary_id", profile.id)
    .order("created_at", { ascending: false })

  const postCount = posts?.length || 0
  const canCreatePost = postCount < MAX_POSTS && userData?.account_status === "approved"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/missionary/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-faith-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Posts</h1>
            <p className="text-gray-600">View and manage your missionary updates</p>
          </div>
          <Link href="/missionary/posts/new">
            <Button disabled={!canCreatePost} className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>

        {/* Post Limit Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">Posts Used</span>
              <span className="text-gray-600">{postCount} / {MAX_POSTS}</span>
            </div>
            <Progress value={(postCount / MAX_POSTS) * 100} className="h-3" />
            <p className="text-sm text-gray-500 mt-2">
              {postCount >= MAX_POSTS 
                ? "You've reached the maximum number of posts. Delete an existing post to create a new one."
                : `You can create ${MAX_POSTS - postCount} more post${MAX_POSTS - postCount === 1 ? "" : "s"}.`
              }
            </p>
          </CardContent>
        </Card>

        {/* Posts List */}
        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {post.title}
                        </h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        {post.status === "approved" && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            Live on Feed
                          </span>
                        )}
                      </div>
                      {post.status === "rejected" && post.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Rejection reason:</strong> {post.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                    {post.image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={post.image_url} 
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Posts Yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first post to share updates with your supporters.
              </p>
              <Link href="/missionary/posts/new">
                <Button disabled={!canCreatePost} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {userData?.account_status !== "approved" && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Account Not Approved</h4>
                  <p className="text-sm text-yellow-700">
                    Your account must be approved before you can create posts. 
                    Please wait for admin approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
