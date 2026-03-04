import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://missionfrica.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]

  // Dynamic missionary pages
  let missionaryPages: MetadataRoute.Sitemap = []
  
  try {
    const supabase = await createClient()
    
    const { data: missionaries } = await supabase
      .from('missionary_profiles')
      .select('id, updated_at')
      .eq('is_verified', true)

    if (missionaries) {
      missionaryPages = missionaries.map((missionary) => ({
        url: `${baseUrl}/missionary/${missionary.id}`,
        lastModified: new Date(missionary.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching missionaries for sitemap:', error)
  }

  return [...staticPages, ...missionaryPages]
}
