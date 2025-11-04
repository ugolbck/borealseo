import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import config from "@/config";

export default function Page() {
  return (
    <>
      <header className="border-b border-base-300 bg-base-100/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{config.appName}</span>
          </div>
          <ButtonSignin text="Sign In" />
        </div>
      </header>

      <main className="min-h-screen">
        {/* Hero Section with Aurora Background */}
        <section className="aurora-bg relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center gap-8">
            <Badge variant="secondary" className="text-sm">
              <Zap className="h-3 w-3 mr-1 inline" />
              2-Day Free Trial
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl">
              AI-Powered{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                SEO Content
              </span>
              {" "}That Ranks
            </h1>

            <p className="text-lg md:text-xl text-base-content/80 max-w-2xl">
              {config.appDescription}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/pricing">
                <Button size="lg" className="btn-gradient text-lg px-8 cursor-pointer">
                  Start Free Trial
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 cursor-pointer">
                  Learn More
                </Button>
              </Link>
            </div>

            <p className="text-sm text-base-content/60">
              No credit card required • 2-day free trial • Cancel anytime
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Everything You Need to Rank Higher
              </h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                From keyword research to AI-generated articles, we&apos;ve got you covered
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: "AI Content Generation",
                  description: "Generate SEO-optimized blog posts in minutes with our advanced AI",
                },
                {
                  icon: TrendingUp,
                  title: "Keyword Research",
                  description: "Find high-value keywords with low competition using DataForSEO",
                },
                {
                  icon: CheckCircle2,
                  title: "7-Day Content Calendar",
                  description: "Plan your content strategy with our intelligent scheduling system",
                },
              ].map((feature, i) => (
                <Card key={i} className="card-glow p-6 bg-base-200">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-base-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Boost Your SEO?
            </h2>
            <p className="text-lg text-base-content/70 mb-8">
              Join hundreds of developers and app creators driving organic traffic with AI-powered content
            </p>
            <Link href="/pricing">
              <Button size="lg" className="btn-gradient text-lg px-8 cursor-pointer">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-300 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">{config.appName}</span>
          </div>
          <div className="flex gap-6 text-sm text-base-content/60">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">
              Privacy
            </Link>
            <Link href="/tos" className="hover:text-primary transition-colors cursor-pointer">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
