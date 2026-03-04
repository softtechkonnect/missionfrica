import Link from "next/link"
import { Heart, Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Heart className="h-7 w-7 text-faith-400" />
              <span className="text-xl font-bold text-white">
                Mission<span className="text-amber-400">Frica</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Connecting donors with verified missionaries across Africa. 
              Together, we can spread the Gospel and transform lives.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com/missionfrica"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-faith-600 transition"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/missionfrica"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-faith-600 transition"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/missionfrica"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-faith-600 transition"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/missionfrica"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-faith-600 transition"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/feed" className="hover:text-white transition">
                  Mission Feed
                </Link>
              </li>
              <li>
                <Link href="/missionaries" className="hover:text-white transition">
                  All Missionaries
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition">
                  Mission News
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Missionaries */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Missionaries</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/register?role=missionary" className="hover:text-white transition">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-white transition">
                  Posting Guidelines
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact & Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:info@missionfrica.com"
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <Mail className="h-4 w-4" />
                  info@missionfrica.com
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>
              &copy; {currentYear} MissionFrica. All rights reserved.
            </p>
            <p className="text-center md:text-right">
              Made with <Heart className="h-4 w-4 inline text-red-500" /> for missionaries worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
