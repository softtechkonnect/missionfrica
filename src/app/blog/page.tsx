import { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, User, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog - Mission Stories & Updates | MissionFrica",
  description: "Read inspiring stories, mission updates, and spiritual insights from missionaries across Africa.",
}

const blogPosts = [
  {
    id: 1,
    title: "The Power of Community in Rural Kenya",
    excerpt: "How a small village transformed through faith and unity. When we first arrived in this remote region, we found a community struggling with...",
    author: "Pastor James Okonkwo",
    date: "2024-02-15",
    category: "Mission Stories",
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Building Schools, Building Futures",
    excerpt: "Education initiatives that are changing lives across the continent. Our latest project in Tanzania has provided schooling for over 200 children...",
    author: "Sarah Mensah",
    date: "2024-02-10",
    category: "Education",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Medical Missions: Healing Body and Soul",
    excerpt: "How our medical outreach programs are bringing hope to underserved communities. Last month, our team conducted over 500 medical consultations...",
    author: "Dr. Emmanuel Adeyemi",
    date: "2024-02-05",
    category: "Healthcare",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    readTime: "6 min read",
  },
  {
    id: 4,
    title: "Youth Revival: The Next Generation of Faith",
    excerpt: "A look at how young people across Africa are embracing faith and becoming leaders in their communities. The youth conference last summer...",
    author: "Grace Kimani",
    date: "2024-01-28",
    category: "Youth Ministry",
    image: "https://images.unsplash.com/photo-1529390079861-591f18f2c0d2?w=600&q=80",
    readTime: "4 min read",
  },
  {
    id: 5,
    title: "Clean Water, Changed Lives",
    excerpt: "The impact of providing clean water access in remote villages. Water is life, and for many communities in Africa, access to clean water...",
    author: "David Mwangi",
    date: "2024-01-20",
    category: "Humanitarian",
    image: "https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=600&q=80",
    readTime: "5 min read",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-faith-600 to-faith-700 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">MissionFrica Blog</h1>
          <p className="text-xl text-faith-100 max-w-2xl mx-auto">
            Inspiring stories, mission updates, and spiritual insights from missionaries across Africa
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Blog Posts */}
          <div className="lg:col-span-2 space-y-6">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-48 md:h-full w-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                      </div>
                      <CardTitle className="text-xl hover:text-faith-600 transition cursor-pointer">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                          Read More
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}

            {/* Load More */}
            <div className="text-center pt-4">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
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
