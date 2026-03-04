"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Newspaper, 
  Plus,
  ChevronLeft,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search,
  MapPin
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface NewsArticle {
  id: string
  title: string
  slug: string
  summary: string
  category: string
  location: string
  status: string
  featured: boolean
  published_at: string | null
  created_at: string
}

export default function AdminNewsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadArticles()
  }, [statusFilter])

  async function loadArticles() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase
        .from("news_articles")
        .select("*")
        .order("created_at", { ascending: false })

      if (statusFilter) {
        query = query.eq("status", statusFilter)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        setError(queryError.message)
      } else {
        setArticles(data as NewsArticle[] || [])
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load articles")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this article?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("news_articles")
        .delete()
        .eq("id", id)

      if (!error) {
        setArticles(articles.filter(a => a.id !== id))
      }
    } catch (err) {
      console.error("Error deleting article:", err)
    }
  }

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.location?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Newspaper className="h-8 w-8 text-faith-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage News</h1>
                <p className="text-gray-600">{articles.length} articles total</p>
              </div>
            </div>
            <Link href="/admin/news/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Article
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
              placeholder="Search articles..."
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
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(article.status)}
                        <Badge variant="outline">{article.category}</Badge>
                        {article.featured && (
                          <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
                        )}
                        {article.location && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {article.location}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                        {article.summary}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {formatDate(article.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/news/${article.slug}`} target="_blank">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/news/${article.id}`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(article.id)}
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
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No news articles found</p>
                <Link href="/admin/news/new">
                  <Button className="mt-4">Create your first article</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
