import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function POST(request: NextRequest) {
  const openai = new OpenAI()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const { postId, prompt } = await request.json()

  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  if (!profile || profile.tokens < TOKEN_COSTS.GENERATE_IMAGE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    })

    const b64Data = response.data?.[0]?.b64_json
    if (!b64Data) {
      return NextResponse.json({ error: "Nu s-a generat imaginea" }, { status: 500 })
    }

    // Upload to Supabase Storage instead of returning raw base64
    const fileName = `${user.id}/${postId || crypto.randomUUID()}-${Date.now()}.png`
    const buffer = Buffer.from(b64Data, "base64")

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Eroare la salvarea imaginii" }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName)

    const imageUrl = publicUrl.publicUrl

    if (postId) {
      await supabase.from("posts").update({
        image_url: imageUrl,
        image_prompt: prompt,
        tokens_used: TOKEN_COSTS.GENERATE_IMAGE,
      }).eq("id", postId).eq("user_id", user.id)
    }

    const newBalance = profile.tokens - TOKEN_COSTS.GENERATE_IMAGE
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -TOKEN_COSTS.GENERATE_IMAGE,
      type: "consumption",
      description: "Generare imagine AI",
      reference_id: postId || null,
      balance_after: newBalance,
    })

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error("Image generation error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Eroare la generarea imaginii" }, { status: 500 })
  }
}
