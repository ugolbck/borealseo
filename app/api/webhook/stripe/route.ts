import configFile from "@/config";
import { stripe, findCheckoutSession } from "@/libs/stripe";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  console.log("🔔 Webhook received");
  const body = await req.text();

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("✅ Webhook signature verified");
  } catch (err) {
    console.error(`❌ Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;
  console.log(`📨 Event type: ${eventType}`);

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        console.log("💳 Processing checkout.session.completed");
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer as string;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        console.log(`Customer ID: ${customerId}`);
        console.log(`Price ID: ${priceId}`);
        console.log(`User ID: ${userId}`);
        console.log(`Plan found: ${plan ? 'Yes' : 'No'}`);

        const customer = (await stripe.customers.retrieve(
          customerId
        )) as Stripe.Customer;

        if (!plan) {
          console.error("❌ Plan not found for priceId:", priceId);
          break;
        }

        let user;
        if (!userId) {
          // check if user already exists
          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const foundUser = existingUser?.users.find((u: any) => u.email === customer.email);

          if (foundUser) {
            user = foundUser;
          } else {
            // create a new user using supabase auth admin
            const { data } = await supabase.auth.admin.createUser({
              email: customer.email,
            });
            user = data?.user;
          }
        } else {
          // find user by ID
          const { data } = await supabase.auth.admin.getUserById(userId);
          user = data?.user;
        }

        if (!user) {
          console.error("❌ User not found");
          break;
        }

        console.log(`✅ User found: ${user.id} (${user.email})`);

        // Determine plan type and subscription details
        const planType = priceId === process.env.STRIPE_LTD_PRICE_ID ? 'ltd' : 'weekly';

        // Create or update subscription record
        const subscriptionData = {
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeObject.subscription as string || null,
          status: 'active' as const,
          plan_type: planType as 'weekly' | 'ltd',
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (planType === 'ltd' ? 100 * 365 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)).toISOString(),
        };

        console.log("💾 Upserting subscription...");
        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: 'user_id' });

        if (subError) {
          console.error("❌ Subscription upsert error:", subError);
          break;
        }

        console.log("✅ Subscription created/updated");

        // Note: Content generation happens after onboarding, not here
        // Users must complete onboarding first to create a website

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({
            status: stripeObject.status,
            cancel_at_period_end: stripeObject.cancel_at_period_end,
            current_period_start: new Date(stripeObject.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeObject.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", stripeObject.id);
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({ status: 'canceled' })
          .eq("stripe_subscription_id", stripeObject.id);
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;
        const customerId = stripeObject.customer;

        // Update subscription status to active
        await supabase
          .from("subscriptions")
          .update({ status: 'active' })
          .eq("stripe_customer_id", customerId);

        // Note: Content generation happens during onboarding for initial setup
        // For renewals, we could generate more content here in the future

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        break;

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}
