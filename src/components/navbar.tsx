"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  Menu, 
  X, 
  Home,
  Users,
  BookOpen,
  Newspaper,
  LogIn,
  UserPlus
} from "lucide-react"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/feed", label: "Feed", icon: Users },
    { href: "/missionaries", label: "Missionaries", icon: Users },
    { href: "/blog", label: "Blog", icon: BookOpen },
    { href: "/news", label: "News", icon: Newspaper },
  ]

  return (
    <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Heart className="h-8 w-8 text-faith-600 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-faith-600/20 rounded-full blur-md group-hover:blur-lg transition" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-faith-900 leading-none">
                Mission<span className="text-amber-600">Frica</span>
              </span>
              <span className="text-[10px] text-gray-500 leading-none">
                Supporting Missionaries
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-faith-600 hover:bg-faith-50 rounded-lg transition"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="gap-2 bg-faith-600 hover:bg-faith-700">
                <UserPlus className="h-4 w-4" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-faith-600 hover:bg-faith-50 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-faith-600 hover:bg-faith-50 rounded-lg transition"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="border-t my-2" />
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-faith-600 hover:bg-faith-50 rounded-lg transition"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button className="w-full gap-2 bg-faith-600 hover:bg-faith-700">
                  <UserPlus className="h-5 w-5" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
