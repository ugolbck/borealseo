import config from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import ButtonCheckout from "@/components/ButtonCheckout";
import { SimpleHeader } from "@/components/SimpleHeader";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Subscribe and get instant access to your SEO content calendar.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          {config.stripe.plans.map((plan: any) => (
            <Card
              key={plan.priceId}
              className="relative w-full max-w-md border-primary shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature: any, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <ButtonCheckout priceId={plan.priceId} />
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-sm">
                What happens after I subscribe?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Once you subscribe, you get immediate access to your dashboard where you can complete onboarding.
                We&apos;ll generate a 7-day content calendar with optimized keywords for your niche, ready for article generation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-sm">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes! You can cancel your subscription at any time. There are no cancellation fees,
                and you&apos;ll retain access until the end of your current 7-day billing period.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-sm">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.
                All transactions are encrypted and secure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-sm">
                How does the content calendar work?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Our AI analyzes your target keywords and creates a strategic 7-day content calendar. Every week when your subscription
                renews, we automatically generate the next 7 days of content, ensuring you always have a full week planned ahead.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-sm">
                Is there a limit on article generation?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                No! Both plans include unlimited article generations. Create as much SEO-optimized content as you need to grow your organic traffic.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-sm">
                Can I generate articles for past days?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes! You can generate articles for any day in your calendar, including past days. This is useful if you miss a day
                or want to backfill content. Your calendar shows all 7 days of the current period.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 py-12 px-4 rounded-lg bg-muted">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Contact our support team and we&apos;ll be happy to help.
          </p>
          <Link href={`mailto:${config.resend.supportEmail}`}>
            <Button variant="outline" className="text-xs cursor-pointer">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
