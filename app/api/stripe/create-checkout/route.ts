import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, userId, type, tier, description, userEmail } = await request.json()

    if (!amount || !type) {
      return NextResponse.json(
        { error: 'Amount and type are required' },
        { status: 400 }
      )
    }

    // Create Stripe customer if we have user info
    // Stripe will handle duplicates by email automatically
    let customerId: string | undefined
    if (userId && userEmail) {
      try {
        // Try to find existing customer by email
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        })
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: userEmail,
            metadata: { userId },
          })
          customerId = customer.id
        }
      } catch (customerError: any) {
        console.warn('Could not create/retrieve Stripe customer:', customerError)
        // Continue without customer ID - Stripe will create one during checkout
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    if (type === 'donation') {
      // One-time donation
      // Stripe doesn't allow both customer and customer_email - use one or the other
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Donation to Diaspora Vote',
                description: description || 'Support our mission to oppose 2030 agenda',
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cancel`,
        metadata: {
          userId: userId || '',
          type: 'donation',
        },
      }

      // Use customer ID if we have it, otherwise use email
      if (customerId) {
        sessionParams.customer = customerId
      } else if (userEmail) {
        sessionParams.customer_email = userEmail
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      return NextResponse.json({ sessionId: session.id })
    } else if (type === 'membership') {
      // One-time membership payment (converted from subscription)
      if (!tier) {
        return NextResponse.json(
          { error: 'Membership tier is required' },
          { status: 400 }
        )
      }

      // Define membership prices (in dollars)
      const tierPrices: Record<string, number> = {
        basic: 10,
        premium: 25,
        champion: 50,
      }

      // Stripe doesn't allow both customer and customer_email - use one or the other
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`,
                description: `Diaspora Vote - ${tier} tier membership`,
              },
              unit_amount: Math.round(tierPrices[tier] * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cancel`,
        metadata: {
          userId: userId || '',
          type: 'membership',
          tier,
        },
      }

      // Use customer ID if we have it, otherwise use email
      if (customerId) {
        sessionParams.customer = customerId
      } else if (userEmail) {
        sessionParams.customer_email = userEmail
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      return NextResponse.json({ sessionId: session.id })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

