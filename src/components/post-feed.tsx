"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin, 
  Clock,
  CheckCircle,
  ChevronDown,
  Users
} from "lucide-react"

export interface Post {
  id: string
  title: string
  content: string
  media_urls?: string[]
  created_at: string
  missionary: {
    id: string
    full_name: string
    avatar_url?: string
    location: string
    organization: string
    is_verified: boolean
  }
}

interface PostFeedProps {
  posts: Post[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ]
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds)
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
      }
    }
    return "Just now"
  }

  const truncatedContent = post.content.length > 300 && !showFullContent
    ? post.content.substring(0, 300) + "..."
    : post.content

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link 
            href={`/missionary/${post.missionary.id}`}
            className="flex items-center gap-3 group"
          >
            <Avatar className="h-12 w-12 border-2 border-faith-100">
              <AvatarImage src={post.missionary.avatar_url} alt={post.missionary.full_name} />
              <AvatarFallback className="bg-faith-100 text-faith-700">
                {post.missionary.full_name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-faith-600 transition">
                  {post.missionary.full_name}
                </h3>
                {post.missionary.is_verified && (
                  <CheckCircle className="h-4 w-4 text-faith-600" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{post.missionary.location}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
          </Link>
        </div>
      </CardHeader>

      {/* Post Content */}
      <CardContent className="pb-3">
        {post.title && (
          <h4 className="font-semibold text-lg text-gray-900 mb-2">{post.title}</h4>
        )}
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {truncatedContent}
        </p>
        {post.content.length > 300 && !showFullContent && (
          <button
            onClick={() => setShowFullContent(true)}
            className="text-faith-600 hover:underline text-sm mt-1"
          >
            Read more
          </button>
        )}
      </CardContent>

      {/* Post Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="space-y-2">
          {post.media_urls.map((url, index) => {
            const isVideo = url.match(/\.(mp4|webm|mov)$/i)
            return isVideo ? (
              <video
                key={index}
                src={url}
                controls
                className="w-full max-h-96 object-contain bg-black"
              />
            ) : (
              <div key={index} className="relative w-full aspect-video bg-gray-100">
                <Image
                  src={url}
                  alt={post.title || `Post image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Post Actions */}
      <CardFooter className="pt-3 flex items-center justify-between border-t">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-1 text-sm transition ${
              isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-faith-600 transition">
            <MessageCircle className="h-5 w-5" />
            <span>Comment</span>
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-faith-600 transition">
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </button>
        </div>
        <Link href={`/missionary/${post.missionary.id}`}>
          <Button size="sm" className="gap-2">
            <Heart className="h-4 w-4" />
            Support This Missionary
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export function PostFeed({ posts, isLoading, hasMore, onLoadMore }: PostFeedProps) {
  if (posts.length === 0 && !isLoading) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
        <p className="text-gray-500">
          Check back soon for updates from our missionaries!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
              </CardContent>
              <div className="h-48 bg-gray-200" />
            </Card>
          ))}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  )
}
