import { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, Calendar, MapPin, ArrowRight, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "News - Latest Mission Updates | MissionFrica",
  description: "Stay updated with the latest news from missionaries and mission organizations across Africa.",
}

const newsItems = [
  {
    id: 1,
    title: "New Church Planted in Remote Ethiopian Village",
    summary: "After years of prayer and groundwork, a new congregation has been established in a previously unreached area of Ethiopia.",
    date: "2024-02-20",
    location: "Ethiopia",
    category: "Church Planting",
    featured: true,
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&q=80",
  },
  {
    id: 2,
    title: "Medical Mission Team Serves 1,000+ Patients in Nigeria",
    summary: "A team of volunteer doctors and nurses provided free medical care to over 1,000 patients in rural Nigeria last month.",
    date: "2024-02-18",
    location: "Nigeria",
    category: "Medical Mission",
    featured: true,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
  },
  {
    id: 3,
    title: "Youth Conference Draws 500 Attendees in Ghana",
    summary: "The annual African Youth for Christ conference saw record attendance this year, with young people from across West Africa.",
    date: "2024-02-15",
    location: "Ghana",
    category: "Youth Ministry",
    featured: false,
    image: "https://images.unsplash.com/photo-1529390079861-591f18f2c0d2?w=600&q=80",
  },
  {
    id: 4,
    title: "Clean Water Project Completed in Tanzania",
    summary: "A new well serving over 2,000 villagers has been completed in rural Tanzania, providing clean water access for the first time.",
    date: "2024-02-12",
    location: "Tanzania",
    category: "Humanitarian",
    featured: false,
    image: "https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=600&q=80",
  },
  {
    id: 5,
    title: "Bible Translation Milestone in Kenya",
    summary: "The New Testament has been successfully translated into the Pokot language, reaching over 700,000 native speakers.",
    date: "2024-02-08",
    location: "Kenya",
    category: "Translation",
    featured: false,
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&q=80",
  },
  {
    id: 6,
    title: "Agricultural Training Program Launches in Uganda",
    summary: "A new initiative teaching sustainable farming practices has launched, helping communities achieve food security.",
    date: "2024-02-05",
    location: "Uganda",
    category: "Development",
    featured: false,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
  },
]

export default function NewsPage() {
  const featuredNews = newsItems.filter(item => item.featured)
  const regularNews = newsItems.filter(item => !item.featured)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-faith-600 to-faith-700 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">Mission News</h1>
          <p className="text-xl text-faith-100 max-w-2xl mx-auto">
            Stay updated with the latest news and updates from missionaries across Africa
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Featured News */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="h-6 w-6 text-faith-600" />
            Featured Stories
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredNews.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="relative h-48">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-amber-500">
                    Featured
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{item.category}</Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <Button variant="ghost" size="sm" className="gap-1">
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* All News */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Latest News</h2>
            {regularNews.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition">
                <div className="md:flex">
                  <div className="md:w-1/4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-32 md:h-full w-full object-cover rounded-l-lg"
                    />
                  </div>
                  <div className="md:w-3/4">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <Button variant="link" size="sm" className="gap-1 p-0 h-auto">
                          Read More
                          <ArrowRight className="h-3 w-3" />
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
                Load More News
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
