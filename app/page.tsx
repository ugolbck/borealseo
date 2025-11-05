import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Calendar, FileText, Search, ArrowRight, Target, BarChart3 } from "lucide-react";
import { SimpleHeader } from "@/components/SimpleHeader";
import config from "@/config";

export default function Page() {
  return (
    <>
      <SimpleHeader />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center gap-8">
            <Badge variant="secondary" className="text-sm">
              <Zap className="h-3 w-3 mr-1 inline" />
              Weekly SEO Content on Autopilot
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl">
              AI-Powered SEO Content{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                That Actually Ranks
              </span>
            </h1>

            <p className="text-lg md:text-xl text-base-content/80 max-w-2xl">
              Stop wasting time on keyword research and content creation. Get a 7-day SEO content calendar automatically generated every week.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/pricing">
                <Button size="lg" className="text-lg px-8 cursor-pointer">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 cursor-pointer">
                  See How It Works
                </Button>
              </Link>
            </div>

            <p className="text-sm text-base-content/60">
              $14.99/week • Cancel anytime • 7 days of content per week
            </p>
          </div>
        </section>

        {/* Problem Section */}
        <section className="bg-base-200 py-24 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="max-w-3xl mx-auto font-extrabold text-4xl md:text-5xl tracking-tight mb-6">
              Writing SEO content is time-consuming and expensive
            </h2>
            <p className="max-w-xl mx-auto text-lg opacity-80 leading-relaxed mb-16">
              Hiring writers costs $500+/month. Doing it yourself takes 4+ hours per article. AI tools still require tons of manual work.
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-4xl mx-auto">
              <div className="flex-1 p-6 bg-base-100 rounded-lg">
                <div className="text-4xl mb-3">😮‍💨</div>
                <h3 className="font-bold mb-2">Manual Research</h3>
                <p className="text-sm text-base-content/70">Hours spent finding keywords with the right difficulty and search volume</p>
              </div>
              <div className="flex-1 p-6 bg-base-100 rounded-lg">
                <div className="text-4xl mb-3">🔄</div>
                <h3 className="font-bold mb-2">Constant Planning</h3>
                <p className="text-sm text-base-content/70">Creating content calendars every week drains your energy</p>
              </div>
              <div className="flex-1 p-6 bg-base-100 rounded-lg">
                <div className="text-4xl mb-3">😔</div>
                <h3 className="font-bold mb-2">Inconsistent Publishing</h3>
                <p className="text-sm text-base-content/70">Miss a few weeks and your organic traffic stalls</p>
              </div>
            </div>
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
                From keyword research to ready-to-publish articles, fully automated
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-base-100 border border-base-300">
                <Search className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Smart Keyword Research</h3>
                <p className="text-base-content/70">We analyze your niche and find high-value, low-competition keywords automatically using DataForSEO API</p>
              </Card>
              <Card className="p-6 bg-base-100 border border-base-300">
                <Calendar className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">7-Day Content Calendar</h3>
                <p className="text-base-content/70">Get a full week of content planned automatically. New calendar generated every week when you renew</p>
              </Card>
              <Card className="p-6 bg-base-100 border border-base-300">
                <FileText className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Article Generation</h3>
                <p className="text-base-content/70">Generate SEO-optimized articles in seconds. Edit, refine, and publish straight to your blog</p>
              </Card>
              <Card className="p-6 bg-base-100 border border-base-300">
                <Target className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Difficulty Filtering</h3>
                <p className="text-base-content/70">We only suggest keywords you can actually rank for—no impossible targets</p>
              </Card>
              <Card className="p-6 bg-base-100 border border-base-300">
                <Zap className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Unlimited Changes</h3>
                <p className="text-base-content/70">Don&apos;t like a keyword? Change it instantly. Regenerate articles as many times as you need</p>
              </Card>
              <Card className="p-6 bg-base-100 border border-base-300">
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Weekly Auto-Renewal</h3>
                <p className="text-base-content/70">Set it and forget it. Your calendar extends automatically every week</p>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-base-200 py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                SEO Content in 3 Simple Steps
              </h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                Stop spending weeks planning content. Start publishing tomorrow.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Subscribe & Onboard</h3>
                <p className="text-base-content/70">Tell us about your website and provide 3-5 seed keywords. Takes 2 minutes.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Generates Your Calendar</h3>
                <p className="text-base-content/70">We research keywords, analyze difficulty, and create a 7-day content calendar automatically.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Generate & Publish</h3>
                <p className="text-base-content/70">Click to generate articles for any day. Edit if needed, then publish to your blog.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Built by Indie Makers, For Indie Makers
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto mb-12">
              We know you&apos;re busy building your product. Let us handle your content marketing.
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-6 bg-base-100 border border-base-300 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">$14.99</div>
                <p className="text-sm text-base-content/70">Per week. Less than one coffee per day.</p>
              </div>
              <div className="p-6 bg-base-100 border border-base-300 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">7 Days</div>
                <p className="text-sm text-base-content/70">Of pre-planned content every single week</p>
              </div>
              <div className="p-6 bg-base-100 border border-base-300 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">∞</div>
                <p className="text-sm text-base-content/70">Unlimited article generation & keyword changes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-b from-base-200 to-base-300 py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Stop Planning. Start Ranking.
            </h2>
            <p className="text-lg text-base-content/70 mb-8 max-w-2xl mx-auto">
              Get your first 7-day content calendar generated in the next 5 minutes. See keywords targeted specifically to your niche.
            </p>
            <Link href="/pricing">
              <Button size="lg" className="text-lg px-8 cursor-pointer">
                Get Started for $14.99/week
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-base-content/60 mt-4">
              Cancel anytime • No long-term commitment
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-300 py-8 px-4 bg-base-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{config.appName}</span>
          </div>
          <div className="flex gap-6 text-sm text-base-content/60">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">
              Privacy
            </Link>
            <Link href="/tos" className="hover:text-primary transition-colors cursor-pointer">
              Terms
            </Link>
            <Link href={`mailto:${config.resend.supportEmail}`} className="hover:text-primary transition-colors cursor-pointer">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
