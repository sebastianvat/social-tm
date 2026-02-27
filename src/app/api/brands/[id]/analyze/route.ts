import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const anthropic = new Anthropic()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { id } = await params

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!brand) return NextResponse.json({ error: "Brand negasit" }, { status: 404 })

  const { data: products } = await supabase
    .from("products")
    .select("name, description, price, category")
    .eq("brand_id", id)
    .limit(30)

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Analizeaza acest brand si genereaza un profil complet pentru social media marketing.

BRAND: ${brand.name}
WEBSITE: ${brand.url}
DESCRIERE EXISTENTA: ${brand.description || "N/A"}

PRODUSE (${products?.length || 0}):
${products?.map(p => `- ${p.name}${p.price ? ` (${p.price})` : ""}${p.category ? ` [${p.category}]` : ""}${p.description ? `: ${p.description}` : ""}`).join("\n") || "Niciun produs"}

Genereaza un JSON cu aceste campuri (toate in romana):
{
  "description": "descriere scurta a brandului (2-3 propozitii)",
  "brand_voice": "vocea brandului - cum vorbeste (ex: prietenos si accesibil, profesional si expert, etc.)",
  "tone": "tonul comunicarii - cum se simte mesajul (ex: cald, entuziast, informativ, etc.)",
  "target_audience": "audienta tinta detaliata (varsta, interese, nevoi, comportament)",
  "content_pillars": ["pilon1", "pilon2", "pilon3", "pilon4", "pilon5"],
  "visual_style": "stilul vizual recomandat pentru imagini si postari",
  "posting_rules": "reguli de continut (ce sa faca si ce sa NU faca pe social media)",
  "competitor_notes": "observatii despre piata si cum sa se diferentieze"
}

Raspunde DOAR cu JSON valid. Fara explicatii.`
      }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const profile = JSON.parse(jsonMatch ? jsonMatch[0] : text)

    // Update brand with AI analysis
    await supabase.from("brands").update({
      description: profile.description || brand.description,
      brand_voice: profile.brand_voice || brand.brand_voice,
      tone: profile.tone,
      target_audience: profile.target_audience,
      content_pillars: profile.content_pillars,
      visual_style: profile.visual_style,
      posting_rules: profile.posting_rules,
      competitor_notes: profile.competitor_notes,
    }).eq("id", id).eq("user_id", user.id)

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error("Brand analysis error:", error?.message || error)
    return NextResponse.json({ error: "Eroare la analiza brandului" }, { status: 500 })
  }
}
