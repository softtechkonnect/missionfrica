import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://missionfrica.com'),
  title: {
    default: "MissionFrica - Supporting Missionaries Across Africa",
    template: "%s | MissionFrica"
  },
  description: "Connect with verified missionaries across Africa. Read their stories, follow their journey, and support their mission work. Join the MissionFrica community today.",
  keywords: ["missionary", "Africa", "Christian", "missions", "support", "donate", "church", "gospel", "ministry"],
  authors: [{ name: "MissionFrica" }],
  creator: "MissionFrica",
  publisher: "MissionFrica",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://missionfrica.com",
    siteName: "MissionFrica",
    title: "MissionFrica - Supporting Missionaries Across Africa",
    description: "Connect with verified missionaries across Africa. Read their stories, follow their journey, and support their mission work.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MissionFrica - Supporting Missionaries Across Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MissionFrica - Supporting Missionaries Across Africa",
    description: "Connect with verified missionaries across Africa. Read their stories and support their mission work.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
