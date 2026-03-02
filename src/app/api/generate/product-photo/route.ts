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
    room: "Professional interior photography. The product is INSTALLED/MOUNTED/PLACED in a real room. For curtains/drapes: hung on a rod in front of a window in an elegant room with white or beige walls, natural daylight filtering through. For furniture: placed in a well-decorated living room. For textiles: draped or displayed in an actual home setting. The room is clean, modern, aspirational. Shallow depth of field, product in sharp focus. Camera angle: slightly below eye level, showing the full product in its environment",
    closeup: "Macro/close-up product photography. Extreme detail shot focusing on the texture, weave pattern, material quality, and craftsmanship of the product. For fabrics: show the thread detail, sheen, drape quality. Soft directional lighting that reveals surface texture. Very shallow depth of field. Fill the frame with the product material. Shot on a 100mm macro lens aesthetic",
    styled: "Styled product scene photography. The product is the hero, surrounded by carefully chosen decorative accessories (ceramic vases, plants, books, candles) that complement but don't compete. For curtains: partially visible with styling elements in foreground. Warm, inviting atmosphere. Natural window light. Interior design magazine aesthetic. The styling should suggest a curated, aspirational lifestyle",
    white: "Clean e-commerce product photography on pure white seamless background. Studio strobe lighting, product centered and fully visible with crisp clean shadows. For fabrics/curtains: neatly arranged to show the full pattern and drape. No props, no distractions. Professional packshot style, suitable for online store product listing page",
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

PRODUCT: ${productName}
${productCategory ? `TYPE: ${productCategory}` : ""}
${productDescription ? `DETAILS: ${productDescription.slice(0, 500)}` : ""}

${refImageB64 ? `CRITICAL REQUIREMENT: A reference photo of the ACTUAL product is attached. You MUST:
1. Keep the EXACT same product — same color, same pattern, same material, same texture
2. Re-create this product in the specified photography style
3. The product in your image must be RECOGNIZABLY the same item as in the reference
4. DO NOT change the product's color palette, pattern, or material type
5. Only change the CONTEXT/SETTING around the product, never the product itself` : `Generate a HIGH QUALITY product photograph. The product must be the clear MAIN SUBJECT. Show realistic characteristics: shape, color, material, texture, pattern.`}

OUTPUT RULES:
- Format: 1:1 square, high resolution, professional photography quality
- ZERO text, letters, words, numbers, watermarks, logos — pure visual only
- Must look like a REAL photograph taken by a professional photographer
- Natural, realistic lighting — not CGI or artificial looking`

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
