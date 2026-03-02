import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenAI } from "@google/genai"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { productId, productName, productDescription, productCategory, productImageUrl, style = "editorial" } = await request.json()

  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  if (!profile || profile.tokens < TOKEN_COSTS.GENERATE_IMAGE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  const styleInstructions: Record<string, string> = {
    editorial: "Editorial product photography, styled in a real-life setting with complementary props, warm natural lighting from a window, shallow depth of field with product in sharp focus, lifestyle context",
    lifestyle: "Lifestyle product photography, product being used or displayed in a beautiful home interior, natural daylight, warm and inviting atmosphere, aspirational setting",
    flatlay: "Flat lay product photography, bird's eye view on a clean surface, carefully arranged with minimal complementary objects, even soft lighting, organized aesthetic",
    white: "Clean product photography on pure white background, studio lighting, product centered and fully visible, crisp shadows, e-commerce style, professional product shot",
    artistic: "Artistic product photography, creative angles and dramatic lighting, moody atmosphere with rich colors, cinematic feel, high-end brand aesthetic",
  }

  const stylePrompt = styleInstructions[style] || styleInstructions.editorial

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

    let refImageB64: string | null = null
    let refImageMime = "image/jpeg"

    if (productImageUrl) {
      try {
        const imgResp = await fetch(productImageUrl, { signal: AbortSignal.timeout(10000) })
        if (imgResp.ok) {
          const imgBuf = await imgResp.arrayBuffer()
          refImageB64 = Buffer.from(imgBuf).toString("base64")
          const ct = imgResp.headers.get("content-type") || "image/jpeg"
          refImageMime = ct.split(";")[0]
        }
      } catch {}
    }

    const prompt = `${stylePrompt}.

SUBJECT: ${productName}
${productCategory ? `CATEGORY: ${productCategory}` : ""}
${productDescription ? `PRODUCT DETAILS: ${productDescription.slice(0, 400)}` : ""}

${refImageB64 ? "CRITICAL: A reference photo of the ACTUAL product is attached. You MUST faithfully represent THIS EXACT product in the generated image — preserve the same colors, patterns, textures, shape, and material. Re-photograph this product in the specified style, do NOT create a different product." : "Generate a HIGH QUALITY product photograph of this exact product. The product must be the clear MAIN SUBJECT of the image. Show the product's real characteristics: shape, color, material, texture, pattern, and details."}

Format: 1:1 square, high resolution.
CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WATERMARKS, NO LOGOS anywhere. Pure visual content only.
NO blurry, NO distorted, NO artificial looking. Must look like a real professional photograph.`

    const contentsParts: any[] = [{ text: prompt }]
    if (refImageB64) {
      contentsParts.push({
        inlineData: { mimeType: refImageMime, data: refImageB64 },
      })
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: contentsParts,
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
    const fileName = `${user.id}/product-studio/${productId || crypto.randomUUID()}-${style}-${Date.now()}.${ext}`
    const buffer = Buffer.from(b64Data, "base64")

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, buffer, { contentType: mimeType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: "Eroare upload imagine" }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from("post-images").getPublicUrl(fileName)
    const imageUrl = publicUrl.publicUrl

    if (productId) {
      await supabase.from("products").update({ image_url: imageUrl }).eq("id", productId)
    }

    const newBalance = profile.tokens - TOKEN_COSTS.GENERATE_IMAGE
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -TOKEN_COSTS.GENERATE_IMAGE,
      type: "consumption",
      description: `Product Studio: ${productName?.slice(0, 40)}`,
      reference_id: productId || null,
      balance_after: newBalance,
    })

    return NextResponse.json({ imageUrl, style })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Eroare la generarea imaginii" }, { status: 500 })
  }
}
