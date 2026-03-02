import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenAI } from "@google/genai"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function POST(request: NextRequest) {
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
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

    let productContext = ""
    if (postId) {
      const { data: post } = await supabase
        .from("posts")
        .select("product_id, products:product_id(name, description, category, price)")
        .eq("id", postId)
        .single()

      if (post?.products && typeof post.products === "object" && "name" in post.products) {
        const p = post.products as { name: string; description?: string; category?: string; price?: string }
        productContext = `\nPRODUCT CONTEXT (the image MUST visually represent this specific product):\n- Product: ${p.name}\n${p.category ? `- Category: ${p.category}\n` : ""}${p.description ? `- Details: ${p.description.slice(0, 200)}\n` : ""}The product must be the MAIN SUBJECT of the image. Show the actual product clearly.\n`
      }
    }

    const enhancedPrompt = `Professional social media image, 1:1 square format.

${prompt}
${productContext}
CRITICAL: The image must contain ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO CAPTIONS, NO WATERMARKS, NO LOGOS anywhere in the image. Pure visual content only.

Style: editorial photography, clean composition, soft natural lighting, shallow depth of field, no borders. Avoid: blurry, distorted, cluttered backgrounds, artificial looking, stock photo feel, any written text.`

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: enhancedPrompt,
    })

    let b64Data: string | null = null
    let mimeType = "image/png"

    for (const part of response.candidates![0].content!.parts!) {
      if (part.inlineData) {
        b64Data = part.inlineData.data!
        mimeType = part.inlineData.mimeType || "image/png"
        break
      }
    }

    if (!b64Data) {
      return NextResponse.json({ error: "Nu s-a generat imaginea" }, { status: 500 })
    }

    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png"
    const fileName = `${user.id}/${postId || crypto.randomUUID()}-${Date.now()}.${ext}`
    const buffer = Buffer.from(b64Data, "base64")

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, buffer, {
        contentType: mimeType,
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
      description: "Generare imagine AI (Nano Banana 2)",
      reference_id: postId || null,
      balance_after: newBalance,
    })

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error("Image generation error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Eroare la generarea imaginii" }, { status: 500 })
  }
}
