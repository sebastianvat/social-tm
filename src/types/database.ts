export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  tokens: number
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  user_id: string
  name: string
  url: string
  description: string | null
  logo_url: string | null
  brand_voice: string | null
  colors: Record<string, string> | null
  last_scan_at: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  brand_id: string
  name: string
  description: string | null
  price: string | null
  currency: string | null
  image_url: string | null
  category: string | null
  url: string | null
  created_at: string
}

export interface ContentCalendar {
  id: string
  brand_id: string
  user_id: string
  month: number
  year: number
  status: 'draft' | 'active' | 'completed'
  post_count: number
  created_at: string
}

export interface Post {
  id: string
  calendar_id: string
  brand_id: string
  user_id: string
  content: string
  hashtags: string[]
  image_url: string | null
  image_prompt: string | null
  post_type: 'promo' | 'educational' | 'engagement' | 'brand_story'
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok'
  scheduled_at: string | null
  published_at: string | null
  status: 'draft' | 'approved' | 'scheduled' | 'published' | 'failed'
  product_id: string | null
  tokens_used: number
  created_at: string
}

export interface SocialAccount {
  id: string
  user_id: string
  brand_id: string
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok'
  account_name: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  created_at: string
}

export interface TokenTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'consumption' | 'bonus' | 'refund'
  description: string
  reference_id: string | null
  balance_after: number
  created_at: string
}

export interface ScanHistory {
  id: string
  brand_id: string
  user_id: string
  url: string
  products_found: number
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  error: string | null
  tokens_used: number
  created_at: string
}
