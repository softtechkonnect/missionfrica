"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  ChevronLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Loader2
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Post {
  id: string
  title: string
  content: string
  status: string
  created_at: string
  missionary_id: string
  media_urls?: string[]
}

export default function AdminPostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)

  useEffect(() => {
    async function loadPost() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        const { data, error: queryError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single()

        if (queryError) {
          setError(queryError.message)
        } else {
          setPost(data as Post)
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load post")
      } finally {
        setIsLoading(false)
      }
    }

    loadPost()
  }, [postId])

  const handleApprove = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const supabase = createClient()
      
      // Verify admin is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in as an admin to approve posts")
        setIsProcessing(false)
        return
      }

      console.log("[Admin] Approving post:", postId, "by user:", user.id)

      const { data, error: updateError } = await supabase
        .from("posts")
        .update({ 
          status: "approved",
          visible: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq("id", postId)
        .select()

      console.log("[Admin] Update result:", { data, error: updateError?.message })

      if (updateError) {
        setError(`Failed to approve post: ${updateError.message}`)
        return
      }

      setPost(prev => prev ? { ...prev, status: "approved" } : null)
    } catch (err: any) {
      console.error("Error approving post:", err)
      setError(`Error: ${err?.message || "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    
    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("posts")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason 
        })
        .eq("id", postId)

      if (!error) {
        setPost(prev => prev ? { ...prev, status: "rejected" } : null)
        setShowRejectForm(false)
      }
    } catch (err) {
      console.error("Error rejecting post:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
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

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Post not found"}</p>
          <Link href="/admin/posts" className="text-blue-600 hover:underline">
            Back to Posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin/posts">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Posts
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-faith-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Review Post</h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(post.status)}
                  <span className="text-sm text-gray-500">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>Post ID: {post.id}</CardDescription>
            </CardHeader>
            <CardContent>
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="mb-4 space-y-3">
                  <p className="text-sm font-medium text-gray-500">Attached Media ({post.media_urls.length}):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {post.media_urls.map((url, index) => {
                      const isVideo = url.match(/\.(mp4|webm|mov)$/i)
                      return isVideo ? (
                        <video
                          key={index}
                          src={url}
                          controls
                          className="w-full max-h-64 object-contain bg-black rounded-lg"
                        />
                      ) : (
                        <img 
                          key={index}
                          src={url} 
                          alt={`${post.title} - media ${index + 1}`}
                          className="w-full max-h-64 object-cover rounded-lg"
                        />
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              </div>
            </CardContent>
          </Card>

          {post.status === "pending_review" && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>Approve or reject this post</CardDescription>
              </CardHeader>
              <CardContent>
                {!showRejectForm ? (
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Post
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isProcessing || !rejectionReason.trim()}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Confirm Rejection
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false)
                          setRejectionReason("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {post.status === "approved" && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                This post has been approved and is now visible to donors.
              </CardContent>
            </Card>
          )}

          {post.status === "rejected" && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                This post has been rejected.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
