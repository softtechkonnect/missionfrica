"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  BookOpen, 
  Plus,
  ChevronLeft,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  author_name: string
  status: string
  featured: boolean
  published_at: string | null
  created_at: string
}

export default function AdminBlogPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [statusFilter])

  async function loadPosts() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (statusFilter) {
        query = query.eq("status", statusFilter)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        setError(queryError.message)
      } else {
        setPosts(data as BlogPost[] || [])
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load posts")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id)

      if (!error) {
        setPosts(posts.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error("Error deleting post:", err)
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-faith-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-faith-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Blog</h1>
                <p className="text-gray-600">{posts.length} posts total</p>
              </div>
            </div>
            <Link href="/admin/blog/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={statusFilter === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("")}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === "published" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("published")}
            >
              Published
            </Button>
            <Button 
              variant={statusFilter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              Drafts
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(post.status)}
                        <Badge variant="outline">{post.category}</Badge>
                        {post.featured && (
                          <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                        {post.excerpt || "No excerpt"}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        By {post.author_name || "Admin"} • {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/blog/${post.id}`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No blog posts found</p>
                <Link href="/admin/blog/new">
                  <Button className="mt-4">Create your first post</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
