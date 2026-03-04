import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
  })
}

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  const stripe = getStripe()
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const supabase = getSupabase()
  const metadata = paymentIntent.metadata

  if (!metadata.missionary_id) {
    console.log('No missionary_id in metadata, skipping')
    return
  }

  const holdDays = Number(process.env.NEXT_PUBLIC_WITHDRAWAL_HOLD_DAYS) || 7
  const availableAt = new Date()
  availableAt.setDate(availableAt.getDate() + holdDays)

  // Insert donation record
  const { error } = await supabase.from('donations').insert({
    missionary_id: metadata.missionary_id,
    donor_id: metadata.donor_id || null,
    stripe_payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    platform_fee: parseInt(metadata.platform_fee) || 0,
    net_amount: parseInt(metadata.net_amount) || paymentIntent.amount,
    status: 'completed',
    donor_name: metadata.donor_name || null,
    donor_email: metadata.donor_email || null,
    message: metadata.message || null,
    is_anonymous: metadata.is_anonymous === 'true',
    available_at: availableAt.toISOString(),
  })

  if (error) {
    console.error('Failed to insert donation:', error)
    throw error
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'donation_completed',
    entity_type: 'donation',
    metadata: {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      missionary_id: metadata.missionary_id,
    },
  })

  console.log(`Donation recorded for missionary ${metadata.missionary_id}`)
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = getSupabase()
  // Check if account is fully onboarded
  const isComplete = account.charges_enabled && account.payouts_enabled

  const { error } = await supabase
    .from('missionary_profiles')
    .update({ 
      stripe_onboarding_complete: isComplete,
    })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('Failed to update account status:', error)
    throw error
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'stripe_account_updated',
    entity_type: 'missionary_profile',
    metadata: {
      stripe_account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    },
  })

  console.log(`Stripe account ${account.id} updated, onboarding complete: ${isComplete}`)
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = getSupabase()
  const paymentIntentId = typeof charge.payment_intent === 'string' 
    ? charge.payment_intent 
    : charge.payment_intent?.id

  if (!paymentIntentId) return

  const { error } = await supabase
    .from('donations')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', paymentIntentId)

  if (error) {
    console.error('Failed to update donation status:', error)
    throw error
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'donation_refunded',
    entity_type: 'donation',
    metadata: {
      charge_id: charge.id,
      payment_intent_id: paymentIntentId,
      amount_refunded: charge.amount_refunded,
    },
  })

  console.log(`Donation refunded: ${paymentIntentId}`)
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  const supabase = getSupabase()
  // Update withdrawal status if we have a matching record
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'completed' })
    .eq('stripe_payout_id', payout.id)

  if (error) {
    console.error('Failed to update withdrawal status:', error)
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'payout_completed',
    entity_type: 'withdrawal',
    metadata: {
      payout_id: payout.id,
      amount: payout.amount,
    },
  })

  console.log(`Payout completed: ${payout.id}`)
}
