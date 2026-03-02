import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenAI, createPartFromUri } from "@google/genai"
import { TOKEN_COSTS } from "@/lib/tokens"

async function getRefImagePart(ai: GoogleGenAI, imageUrl: string) {
  const imgResp = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) })
  if (!imgResp.ok) return null

  const ct = imgResp.headers.get("content-type") || "image/jpeg"
  const mime = ct.split(";")[0]
  const buf = await imgResp.arrayBuffer()

  try {
    const blob = new Blob([buf], { type: mime })
    const uploaded = await ai.files.upload({ file: blob, config: { mimeType: mime } })
    if (uploaded.uri) return createPartFromUri(uploaded.uri, uploaded.mimeType || mime)
  } catch {}

  if (buf.byteLength <= 2_000_000) {
    return { inlineData: { mimeType: mime, data: Buffer.from(buf).toString("base64") } }
  }

  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { productId, productName, productDescription, productCategory, productImageUrl, style = "room" } = await request.json()

  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  if (!profile || profile.tokens < TOKEN_COSTS.GENERATE_IMAGE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  const styleInstructions: Record<string, string> = {
    room: "Product installed in a real room. Curtains: hung on rod, window, white/beige walls, natural daylight. Furniture: in decorated living room. Clean, modern, aspirational. Shallow DOF, product sharp.",
    closeup: "Macro close-up on texture, weave, material quality, craftsmanship. Soft directional light reveals surface. Very shallow DOF. Fill frame with material detail.",
    styled: "Product as hero with decorative accessories (vases, plants, candles). Warm atmosphere, natural window light. Interior design magazine aesthetic.",
    white: "Pure white background, studio lighting, product centered, crisp shadows. E-commerce packshot style. No props, no distractions.",
  }

  const stylePrompt = styleInstructions[style] || styleInstructions.room

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

    let refImagePart: any = null
    if (productImageUrl) {
      try { refImagePart = await getRefImagePart(ai, productImageUrl) } catch {}
    }

    const hasRef = !!refImagePart
    const prompt = `${stylePrompt}
Product: ${productName}${productCategory ? ` (${productCategory})` : ""}
${productDescription ? productDescription.slice(0, 250) : ""}
${hasRef ? "CRITICAL: Reference photo attached. Keep EXACT same product colors, pattern, material, texture. Only change the setting/context." : "Show realistic product characteristics."}
Rules: 1:1 square, NO text/watermarks/logos, professional photography, natural lighting.`

    const contentsParts: any[] = [{ text: prompt }]
    if (refImagePart) contentsParts.push(refImagePart)

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
