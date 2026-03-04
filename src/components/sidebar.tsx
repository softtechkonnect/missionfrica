"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Quote, Newspaper, FileText, RefreshCw } from "lucide-react"
import Link from "next/link"

interface BibleVerse {
  text: string
  reference: string
}

interface QuoteItem {
  text: string
  author: string
}

interface NewsItem {
  id: string
  title: string
  date: string
  excerpt: string
  slug: string
}

interface BlogPost {
  id: string
  title: string
  date: string
  excerpt: string
  slug: string
}

const bibleVerses: BibleVerse[] = [
  { text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", reference: "John 3:16" },
  { text: "Trust in the LORD with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
  { text: "I can do all things through him who strengthens me.", reference: "Philippians 4:13" },
  { text: "The LORD is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.", reference: "Joshua 1:9" },
  { text: "And we know that for those who love God all things work together for good.", reference: "Romans 8:28" },
  { text: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.", reference: "Matthew 6:33" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", reference: "Matthew 11:28" },
]

const inspirationalQuotes: QuoteItem[] = [
  { text: "The Great Commission is not an option to be considered; it is a command to be obeyed.", author: "Hudson Taylor" },
  { text: "God isn't looking for people of great faith, but for individuals ready to follow Him.", author: "Hudson Taylor" },
  { text: "If Jesus Christ be God and died for me, then no sacrifice can be too great for me to make for Him.", author: "C.T. Studd" },
  { text: "The mission of the church is missions.", author: "Oswald J. Smith" },
  { text: "Prayer is the greater work. Missions is the lesser work.", author: "Andrew Murray" },
  { text: "Go, send, or disobey.", author: "John Piper" },
]

const defaultNews: NewsItem[] = [
  { id: "1", title: "New Church Planted in Rural Kenya", date: "2026-02-25", excerpt: "A new congregation of 50 believers gathers for worship...", slug: "new-church-kenya" },
  { id: "2", title: "Medical Mission Serves 500 in Nigeria", date: "2026-02-22", excerpt: "Free medical care provided to underserved communities...", slug: "medical-mission-nigeria" },
  { id: "3", title: "Youth Conference in Ghana Draws 1000", date: "2026-02-18", excerpt: "Young people across West Africa gather for discipleship...", slug: "youth-conference-ghana" },
]

const defaultBlogPosts: BlogPost[] = [
  { id: "1", title: "The Heart of a Missionary", date: "2026-02-20", excerpt: "What drives someone to leave everything behind...", slug: "heart-of-missionary" },
  { id: "2", title: "How Your Support Makes a Difference", date: "2026-02-15", excerpt: "See the real impact of faithful giving...", slug: "support-makes-difference" },
  { id: "3", title: "Stories from the Field", date: "2026-02-10", excerpt: "Testimonials from missionaries across Africa...", slug: "stories-from-field" },
]

export function Sidebar() {
  const [currentVerse, setCurrentVerse] = useState<BibleVerse>(bibleVerses[0])
  const [currentQuote, setCurrentQuote] = useState<QuoteItem>(inspirationalQuotes[0])

  useEffect(() => {
    const verseIndex = Math.floor(Math.random() * bibleVerses.length)
    const quoteIndex = Math.floor(Math.random() * inspirationalQuotes.length)
    setCurrentVerse(bibleVerses[verseIndex])
    setCurrentQuote(inspirationalQuotes[quoteIndex])
  }, [])

  const refreshVerse = () => {
    const newIndex = Math.floor(Math.random() * bibleVerses.length)
    setCurrentVerse(bibleVerses[newIndex])
  }

  const refreshQuote = () => {
    const newIndex = Math.floor(Math.random() * inspirationalQuotes.length)
    setCurrentQuote(inspirationalQuotes[newIndex])
  }

  return (
    <aside className="space-y-6">
      {/* Daily Bible Verse */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <BookOpen className="h-5 w-5" />
              Daily Verse
            </CardTitle>
            <button
              onClick={refreshVerse}
              className="p-1 hover:bg-amber-100 rounded transition"
              aria-label="Get new verse"
            >
              <RefreshCw className="h-4 w-4 text-amber-700" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <blockquote className="text-sm text-amber-900 italic leading-relaxed">
            &ldquo;{currentVerse.text}&rdquo;
          </blockquote>
          <cite className="text-xs text-amber-700 font-semibold mt-2 block not-italic">
            — {currentVerse.reference}
          </cite>
        </CardContent>
      </Card>

      {/* Inspirational Quote */}
      <Card className="bg-gradient-to-br from-faith-50 to-blue-50 border-faith-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-faith-900">
              <Quote className="h-5 w-5" />
              Missionary Quote
            </CardTitle>
            <button
              onClick={refreshQuote}
              className="p-1 hover:bg-faith-100 rounded transition"
              aria-label="Get new quote"
            >
              <RefreshCw className="h-4 w-4 text-faith-700" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <blockquote className="text-sm text-faith-900 italic leading-relaxed">
            &ldquo;{currentQuote.text}&rdquo;
          </blockquote>
          <cite className="text-xs text-faith-700 font-semibold mt-2 block not-italic">
            — {currentQuote.author}
          </cite>
        </CardContent>
      </Card>

      {/* Latest News */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-green-600" />
            Mission News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultNews.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.slug}`}
              className="block group"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-medium group-hover:text-faith-600 transition line-clamp-2">
                  {news.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {new Date(news.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href="/news"
            className="text-sm text-faith-600 hover:underline block mt-2"
          >
            View all news →
          </Link>
        </CardContent>
      </Card>

      {/* Blog Posts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            From the Blog
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultBlogPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-medium group-hover:text-faith-600 transition line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href="/blog"
            className="text-sm text-faith-600 hover:underline block mt-2"
          >
            Read more articles →
          </Link>
        </CardContent>
      </Card>

      {/* Support CTA */}
      <Card className="bg-gradient-to-br from-faith-600 to-faith-700 text-white border-0">
        <CardContent className="pt-6 text-center">
          <h3 className="font-bold text-lg mb-2">Make a Difference Today</h3>
          <p className="text-sm text-faith-100 mb-4">
            Your support helps missionaries spread the Gospel across Africa.
          </p>
          <Link href="/missionaries">
            <Badge className="bg-white text-faith-700 hover:bg-faith-50 cursor-pointer px-4 py-2 text-sm">
              Support a Missionary
            </Badge>
          </Link>
        </CardContent>
      </Card>
    </aside>
  )
}
