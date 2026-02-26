import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const META_APP_ID = process.env.META_APP_ID || ""
const META_APP_SECRET = process.env.META_APP_SECRET || ""
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/meta/callback`

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const brandId = searchParams.get("state")

  if (!code || !user || !brandId) {
    return NextResponse.redirect(new URL("/dashboard/brands?error=auth_failed", request.url))
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return NextResponse.redirect(new URL("/dashboard/brands?error=token_failed", request.url))
    }

    // Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    )
    const longTokenData = await longTokenRes.json()
    const accessToken = longTokenData.access_token || tokenData.access_token

    // Get user's pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()

    if (pagesData.data && pagesData.data.length > 0) {
      const page = pagesData.data[0]

      // Save Facebook page
      await supabase.from("social_accounts").upsert({
        user_id: user.id,
        brand_id: brandId,
        platform: "facebook",
        account_name: page.name,
        access_token: page.access_token,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "brand_id,platform" })

      // Check for Instagram business account
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${page.access_token}`
      )
      const igData = await igRes.json()

      if (igData.instagram_business_account) {
        await supabase.from("social_accounts").upsert({
          user_id: user.id,
          brand_id: brandId,
          platform: "instagram",
          account_name: igData.instagram_business_account.username || page.name,
          access_token: page.access_token,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "brand_id,platform" })
      }
    }

    return NextResponse.redirect(new URL(`/dashboard/brands/${brandId}?connected=true`, request.url))
  } catch (error) {
    console.error("Meta OAuth error:", error)
    return NextResponse.redirect(new URL("/dashboard/brands?error=connection_failed", request.url))
  }
}
