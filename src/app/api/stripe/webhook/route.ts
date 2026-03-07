import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import Stripe from "stripe"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true })
    }

    const userId = session.metadata?.user_id
    const packId = session.metadata?.pack_id
    const tokens = parseInt(session.metadata?.tokens || "0", 10)

    if (!userId || !tokens) {
      console.error("Missing metadata in checkout session:", session.id)
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", userId)
      .single()

    if (!profile) {
      console.error("Profile not found for user:", userId)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const newBalance = (profile.tokens || 0) + tokens

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ tokens: newBalance })
      .eq("id", userId)

    if (updateError) {
      console.error("Failed to update tokens:", updateError)
      return NextResponse.json({ error: "Token update failed" }, { status: 500 })
    }

    await supabase.from("token_transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: tokens,
      description: `Achizitie pachet ${packId} — ${tokens} tokeni`,
      balance_after: newBalance,
      stripe_session_id: session.id,
    })
  }

  return NextResponse.json({ received: true })
}
