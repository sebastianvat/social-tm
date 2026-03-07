import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTokenPackById } from "@/lib/tokens"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
    }

    const { packId } = await request.json()
    const pack = getTokenPackById(packId)
    if (!pack) {
      return NextResponse.json({ error: "Pachet invalid" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${pack.name} — ${pack.tokens} tokeni`,
              description: `Pachet ${pack.name} pentru Social TM`,
            },
            unit_amount: pack.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        pack_id: pack.id,
        tokens: String(pack.tokens),
      },
      customer_email: user.email,
      success_url: `${origin}/dashboard/tokens?success=true&tokens=${pack.tokens}`,
      cancel_url: `${origin}/dashboard/tokens?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Eroare la crearea sesiunii de plata" },
      { status: 500 }
    )
  }
}
