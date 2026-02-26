import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const { postId } = await request.json()

  // Get post
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", user.id)
    .single()

  if (!post) {
    return NextResponse.json({ error: "Postare negasita" }, { status: 404 })
  }

  // Check tokens
  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tokens < TOKEN_COSTS.AUTO_POST) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  // Get social account
  const { data: account } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("brand_id", post.brand_id)
    .eq("platform", post.platform)
    .single()

  if (!account) {
    return NextResponse.json({ error: `Contul de ${post.platform} nu este conectat` }, { status: 400 })
  }

  try {
    let publishResult: any

    if (post.platform === "facebook") {
      // Publish to Facebook Page
      const pageId = account.account_name
      const body: Record<string, string> = {
        message: `${post.content}\n\n${post.hashtags?.join(" ") || ""}`,
        access_token: account.access_token,
      }

      if (post.image_url) {
        body.url = post.image_url
        const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        publishResult = await res.json()
      } else {
        const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        publishResult = await res.json()
      }
    } else if (post.platform === "instagram") {
      if (!post.image_url) {
        return NextResponse.json({ error: "Instagram necesita o imagine" }, { status: 400 })
      }

      // Step 1: Create media container
      const createRes = await fetch(`https://graph.facebook.com/v21.0/${account.account_name}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: post.image_url,
          caption: `${post.content}\n\n${post.hashtags?.join(" ") || ""}`,
          access_token: account.access_token,
        }),
      })
      const createData = await createRes.json()

      if (createData.id) {
        // Step 2: Publish
        const publishRes = await fetch(`https://graph.facebook.com/v21.0/${account.account_name}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: account.access_token,
          }),
        })
        publishResult = await publishRes.json()
      }
    }

    if (publishResult?.error) {
      await supabase.from("posts").update({ status: "failed" }).eq("id", postId)
      return NextResponse.json({ error: publishResult.error.message }, { status: 400 })
    }

    // Update post status
    await supabase.from("posts").update({
      status: "published",
      published_at: new Date().toISOString(),
    }).eq("id", postId)

    // Deduct tokens
    const newBalance = profile.tokens - TOKEN_COSTS.AUTO_POST
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -TOKEN_COSTS.AUTO_POST,
      type: "consumption",
      description: `Auto-post ${post.platform}: ${post.content.substring(0, 40)}...`,
      reference_id: postId,
      balance_after: newBalance,
    })

    return NextResponse.json({ success: true, publishResult })
  } catch (error) {
    console.error("Publish error:", error)
    await supabase.from("posts").update({ status: "failed" }).eq("id", postId)
    return NextResponse.json({ error: "Eroare la publicare" }, { status: 500 })
  }
}
