import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { missionaryId, amount, donorName, donorEmail, message, isAnonymous } = body

    if (!missionaryId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum donation is $1.00' },
        { status: 400 }
      )
    }

    // Get missionary profile with Stripe account
    const { data: profile, error: profileError } = await supabase
      .from('missionary_profiles')
      .select(`
        id,
        stripe_account_id,
        stripe_onboarding_complete,
        organization_name,
        user_id,
        users (
          id,
          full_name,
          account_status
        )
      `)
      .eq('id', missionaryId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Missionary not found' },
        { status: 404 }
      )
    }

    // Handle users relation (could be array or object depending on Supabase version)
    const userData = Array.isArray(profile.users) ? profile.users[0] : profile.users
    
    if (userData?.account_status !== 'approved') {
      return NextResponse.json(
        { error: 'Missionary is not approved to receive donations' },
        { status: 400 }
      )
    }

    if (!profile.stripe_account_id || !profile.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Missionary has not completed payment setup' },
        { status: 400 }
      )
    }

    // Calculate platform fee (10%)
    const platformFeePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT) || 10
    const platformFee = Math.round(amount * (platformFeePercent / 100))
    const netAmount = amount - platformFee

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Create Stripe Checkout Session with destination charge
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${userData?.full_name || 'Missionary'}`,
              description: `Supporting ${profile.organization_name}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: profile.stripe_account_id,
        },
        metadata: {
          missionary_id: missionaryId,
          donor_id: user?.id || '',
          donor_name: donorName || '',
          donor_email: donorEmail || '',
          message: message || '',
          is_anonymous: isAnonymous ? 'true' : 'false',
          platform_fee: platformFee.toString(),
          net_amount: netAmount.toString(),
        },
      },
      customer_email: donorEmail || user?.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/missionaries/${userData?.id || missionaryId}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
