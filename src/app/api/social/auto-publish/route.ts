import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@supabase/supabase-js"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

  const { data: posts } = await supabase
    .from("posts")
    .select("*, social_accounts!inner(*)")
    .eq("status", "scheduled")
    .lte("scheduled_at", now.toISOString())
    .gte("scheduled_at", fiveMinutesAgo.toISOString())

  if (!posts || posts.length === 0) {
    return NextResponse.json({ message: "Nicio postare de publicat", count: 0 })
  }

  let published = 0
  let failed = 0

  for (const post of posts) {
    try {
      const account = (post as any).social_accounts

      // Check user tokens
      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", post.user_id)
        .single()

      if (!profile || profile.tokens < TOKEN_COSTS.AUTO_POST) {
        await supabase.from("posts").update({ status: "failed" }).eq("id", post.id)
        failed++
        continue
      }

      let success = false

      if (post.platform === "facebook") {
        const body: Record<string, string> = {
          message: `${post.content}\n\n${post.hashtags?.join(" ") || ""}`,
          access_token: account.access_token,
        }

        const endpoint = post.image_url ? "photos" : "feed"
        if (post.image_url) body.url = post.image_url

        const res = await fetch(`https://graph.facebook.com/v21.0/me/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const result = await res.json()
        success = !result.error
      }

      if (success) {
        await supabase.from("posts").update({
          status: "published",
          published_at: new Date().toISOString(),
        }).eq("id", post.id)

        const newBalance = profile.tokens - TOKEN_COSTS.AUTO_POST
        await supabase.from("profiles").update({ tokens: newBalance }).eq("id", post.user_id)
        await supabase.from("token_transactions").insert({
          user_id: post.user_id,
          amount: -TOKEN_COSTS.AUTO_POST,
          type: "consumption",
          description: `Auto-post ${post.platform}`,
          reference_id: post.id,
          balance_after: newBalance,
        })
        published++
      } else {
        await supabase.from("posts").update({ status: "failed" }).eq("id", post.id)
        failed++
      }
    } catch {
      await supabase.from("posts").update({ status: "failed" }).eq("id", post.id)
      failed++
    }
  }

  return NextResponse.json({ published, failed, total: posts.length })
}
