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

  const categories = [...new Set(products?.map(p => p.category).filter(Boolean) || [])]
  const priceRange = products?.length
    ? (() => {
        const prices = products.map(p => parseFloat((p.price || "0").replace(/[^\d.,]/g, "").replace(",", "."))).filter(n => n > 0)
        return prices.length ? `${Math.min(...prices).toFixed(0)} - ${Math.max(...prices).toFixed(0)}` : "N/A"
      })()
    : "N/A"

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `Esti un Brand Strategist senior cu 15 ani experienta in piata romaneasca. Analizezi branduri si creezi strategii de social media care genereaza engagement real. Gandesti data-driven, cunosti comportamentul consumatorului roman, si stii ce functioneaza pe fiecare platforma.`,
      messages: [{
        role: "user",
        content: `Analizeaza acest brand si creeaza un profil strategic complet pentru social media.

═══ DATE BRAND ═══
Nume: ${brand.name}
Website: ${brand.url}
Descriere curenta: ${brand.description || "Fara descriere"}

═══ CATALOG PRODUSE (${products?.length || 0} produse) ═══
Categorii: ${categories.length ? categories.join(", ") : "Necategorizate"}
Range pret: ${priceRange}
${products?.slice(0, 20).map(p => `• ${p.name}${p.price ? ` — ${p.price}` : ""}${p.category ? ` [${p.category}]` : ""}`).join("\n") || "Niciun produs scanat"}

═══ ANALIZA CERUTA ═══
Gandeste pas cu pas:
1. Ce tip de business e? (e-commerce, servicii, B2B, B2C, nisa)
2. Cine e clientul ideal? (demografie, psihografie, comportament de cumparare)
3. Ce emotie vinde acest brand? (nu produsul, ci sentimentul)
4. Cum ar trebui sa vorbeasca pe social media? (ca un prieten expert, ca un brand premium, ca un vecin de incredere?)
5. Ce tipuri de continut ar genera cel mai mult engagement?

═══ FORMAT OUTPUT — JSON STRICT ═══
{
  "description": "Descriere brand 3-4 propozitii: ce face, pentru cine, ce il diferentiaza. Concret, nu generic.",
  
  "brand_voice": "Descriere detaliata a vocii: personalitate (3 adjective), nivel formalitate (1-10), cum saluta, cum face CTA, cum raspunde la comentarii. Exemplu: 'Prietenos si accesibil ca un vecin care stie tot despre [domeniu]. Formalitate 3/10. Saluta cu Hei/Salut. CTA-urile sunt intrebari nu imperative.'",
  
  "tone": "3 tonuri primare separate prin virgula + context cand le foloseste. Ex: 'Cald si empatic (storytelling), Entuziast si energic (lansari produse), Informativ si clar (educational)'",
  
  "target_audience": "Profil detaliat: Varsta (range), Gen (daca relevant), Locatie, Venituri (nivel), Interese (5+), Nevoi principale (3+), Unde petrec timp online, Ce ii motiveaza sa cumpere",
  
  "content_pillars": ["Pilon 1 — legat direct de produs/serviciu", "Pilon 2 — educational pentru audienta", "Pilon 3 — lifestyle/aspirational", "Pilon 4 — behind the scenes/autenticitate", "Pilon 5 — comunitate/engagement"],
  
  "visual_style": "Stil fotografie/imagine: tip (flat lay, lifestyle, minimal), culori dominante (3 culori hex), lighting (natural/studio/moody), props recurente, ce sa NU apara niciodata in imagini. Optimizat pentru generare AI.",
  
  "posting_rules": "DO: [3-5 reguli specifice]\\nDON'T: [3-5 anti-patterns]\\nFRECVENTA: [cate postari/saptamana, ce zile, ce ore]\\nHASHTAG STRATEGY: [cate, mix branded + niche + trending]",
  
  "competitor_notes": "Pozitionare vs competitie: 2-3 competitori probabili, ce fac ei bine, unde are avantaj acest brand, oportunitate de diferentiere clara."
}

RASPUNDE DOAR CU JSON VALID. Fara text inainte sau dupa.`
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
