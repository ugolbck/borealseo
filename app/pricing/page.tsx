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

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            {config.appName}
          </Link>
          <Link href="/signin">
            <Button variant="outline" size="sm" className="text-xs cursor-pointer">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 2-day free trial. No credit card required.
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
                What&apos;s included in the free trial?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Our {config.trial.durationDays}-day free trial gives you access to the current day and next day&apos;s content,
                including AI-powered article generation and keyword research. You can test all core features before committing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-sm">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes! You can cancel your subscription at any time from your dashboard. There are no cancellation fees,
                and you&apos;ll retain access until the end of your billing period.
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
                Our AI analyzes your target keywords and creates a strategic content calendar. The weekly plan includes a 7-day calendar,
                while the monthly plan extends this to 30 days, giving you more time to plan and execute your content strategy.
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
                What makes the monthly plan better value?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                The monthly plan includes everything in the weekly plan plus a longer 30-day content calendar, priority keyword suggestions,
                advanced SEO analytics, and priority support. It&apos;s perfect for serious content creators who want more planning flexibility.
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
