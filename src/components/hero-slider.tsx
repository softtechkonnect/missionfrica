"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Slide {
  id: number
  image: string
  quote: string
  author: string
  missionaryName?: string
  missionaryId?: string
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1920&q=80",
    quote: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.",
    author: "Matthew 28:19",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&q=80",
    quote: "The harvest is plentiful, but the laborers are few. Therefore pray earnestly to the Lord of the harvest to send out laborers into his harvest.",
    author: "Matthew 9:37-38",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1920&q=80",
    quote: "How beautiful are the feet of those who preach the good news!",
    author: "Romans 10:15",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1469571486292-b53601010376?w=1920&q=80",
    quote: "For I am not ashamed of the gospel, for it is the power of God for salvation to everyone who believes.",
    author: "Romans 1:16",
  },
]

interface HeroSliderProps {
  slides?: Slide[]
  autoPlayInterval?: number
}

export function HeroSlider({ slides = defaultSlides, autoPlayInterval = 6000 }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const nextSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating, slides.length])

  const prevSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating, slides.length])

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  useEffect(() => {
    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
  }, [nextSlide, autoPlayInterval])

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-900">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
            <div
              className={`max-w-4xl transition-all duration-700 delay-200 ${
                index === currentSlide
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <blockquote className="text-2xl md:text-4xl lg:text-5xl font-serif text-white leading-relaxed mb-6">
                &ldquo;{slide.quote}&rdquo;
              </blockquote>
              <cite className="text-lg md:text-xl text-amber-400 font-medium not-italic">
                — {slide.author}
              </cite>
              {slide.missionaryName && slide.missionaryId && (
                <div className="mt-6">
                  <Link href={`/missionary/${slide.missionaryId}`}>
                    <Button variant="secondary" size="lg">
                      Meet {slide.missionaryName}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-amber-400 w-8"
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </div>
  )
}
