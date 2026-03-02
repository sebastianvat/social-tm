import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

const COST = 2

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { productId, productName, originalDescription, category, price } = await request.json()

  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  if (!profile || profile.tokens < COST) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  try {
    const anthropic = new Anthropic()

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `Esti copywriter expert in e-commerce romanesc. Scrii descrieri de produs care VAND. Stilul tau: clar, beneficii-first, emotional dar nu exagerat. Scrii in romana corecta.`,
      messages: [{
        role: "user",
        content: `Optimizeaza descrierea acestui produs. Pastreaza informatiile factuale (dimensiuni, materiale, culori) dar fa textul mai atractiv si convingator.

PRODUS: ${productName}
${category ? `CATEGORIE: ${category}` : ""}
${price ? `PRET: ${price}` : ""}
DESCRIERE ORIGINALA:
${originalDescription || "Fara descriere disponibila - creeaza una bazata pe numele produsului si categorie."}

Genereaza un JSON cu exact aceste 3 variante:
{
  "short": "Descriere scurta (max 50 cuvinte) — pentru social media, catchy, cu emoji subtil",
  "medium": "Descriere medie (80-120 cuvinte) — pentru site, beneficii + features, paragraf fluent",
  "seo": "Descriere SEO (100-150 cuvinte) — cu keywords naturale, structurata cu bullet points (foloseste •)"
}

RASPUNDE DOAR CU JSON. Fara markdown, fara explicatii.`,
      }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")

    const descriptions = JSON.parse(jsonMatch[0])

    if (productId && descriptions.medium) {
      await supabase.from("products").update({ description: descriptions.medium }).eq("id", productId)
    }

    const newBalance = profile.tokens - COST
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -COST,
      type: "consumption",
      description: `Product Studio desc: ${productName?.slice(0, 40)}`,
      reference_id: productId || null,
      balance_after: newBalance,
    })

    return NextResponse.json({ descriptions })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Eroare la optimizare" }, { status: 500 })
  }
}
