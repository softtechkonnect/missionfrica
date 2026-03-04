"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react"
import { getPostStatusColor, formatDate, truncate } from "@/lib/utils"

interface Post {
  id: string
  title: string
  content: string
  status: string
  created_at: string
  missionary_id: string
}

export default function AdminPostsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const page = parseInt(searchParams.get("page") || "1")
  const perPage = 10
  const statusFilter = searchParams.get("status") || ""

  const statusOptions = [
    { value: "", label: "All", icon: FileText },
    { value: "pending_review", label: "Pending", icon: Clock },
    { value: "approved", label: "Approved", icon: CheckCircle },
    { value: "rejected", label: "Rejected", icon: XCircle },
  ]

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        const offset = (page - 1) * perPage
        let query = supabase
          .from("posts")
          .select(`
            id,
            title,
            content,
            status,
            created_at,
            missionary_id
          `, { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + perPage - 1)

        if (statusFilter) {
          query = query.eq("status", statusFilter)
        }

        const { data, count, error: queryError } = await query

        if (queryError) {
          setError(queryError.message)
        } else {
          setPosts(data as Post[] || [])
          setTotalCount(count || 0)
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load posts")
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [page, statusFilter])

  const totalPages = Math.ceil(totalCount / perPage)

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
              <FileText className="h-8 w-8 text-faith-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Posts</h1>
                <p className="text-gray-600">{totalCount} posts total</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {statusOptions.map((option) => (
            <Link
              key={option.value}
              href={`/admin/posts?status=${option.value}`}
            >
              <Button
                variant={statusFilter === option.value || (!statusFilter && !option.value) ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post: any) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPostStatusColor(post.status)}>
                          {post.status.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <p className="text-gray-600 mt-1">
                        {truncate(post.content, 150)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Post ID: {post.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Link href={`/admin/posts/${post.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No posts found
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Link href={`/admin/posts?page=${page - 1}&status=${statusFilter || ""}`}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              </Link>
              <Link href={`/admin/posts?page=${page + 1}&status=${statusFilter || ""}`}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
