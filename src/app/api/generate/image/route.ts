import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenAI, createPartFromUri } from "@google/genai"
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
    let refImagePart: any = null

    if (postId) {
      const { data: post } = await supabase
        .from("posts")
        .select("product_id, products:product_id(name, description, category, price, image_url)")
        .eq("id", postId)
        .single()

      if (post?.products && typeof post.products === "object" && "name" in post.products) {
        const p = post.products as { name: string; description?: string; category?: string; price?: string; image_url?: string }
        productContext = `\nPRODUCT: ${p.name}${p.category ? ` (${p.category})` : ""}${p.description ? `\n${p.description.slice(0, 200)}` : ""}\nCRITICAL: Reference photo attached. Keep EXACT same product colors, pattern, material, texture. Place in professional setting.\n`

        if (p.image_url) {
          try {
            const imgResp = await fetch(p.image_url, { signal: AbortSignal.timeout(8000) })
            if (imgResp.ok) {
              const ct = imgResp.headers.get("content-type") || "image/jpeg"
              const mime = ct.split(";")[0]
              const blob = await imgResp.blob()

              const uploaded = await ai.files.upload({
                file: blob,
                config: { mimeType: mime },
              })

              if (uploaded.uri) {
                refImagePart = createPartFromUri(uploaded.uri, uploaded.mimeType || mime)
              }
            }
          } catch {}
        }
      }
    }

    const enhancedPrompt = `Professional social media image, 1:1 square.
${prompt}
${productContext}
Rules: NO text/watermarks/logos. Editorial photography, clean composition, soft natural lighting, shallow DOF.`

    const contentsParts: any[] = [{ text: enhancedPrompt }]
    if (refImagePart) {
      contentsParts.push(refImagePart)
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
    const fileName = `${user.id}/${postId || crypto.randomUUID()}-${Date.now()}.${ext}`
    const buffer = Buffer.from(b64Data, "base64")

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, buffer, { contentType: mimeType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: "Eroare la salvarea imaginii" }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from("post-images").getPublicUrl(fileName)
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
    return NextResponse.json({ error: error?.message || "Eroare la generarea imaginii" }, { status: 500 })
  }
}
