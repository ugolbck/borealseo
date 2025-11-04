"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Lock } from "lucide-react";

export function PaywallModal() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Trial Expired</h2>
          <p className="text-sm text-muted-foreground">
            Your free trial has ended. Upgrade now to continue generating SEO content and growing
            your traffic.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full btn-gradient"
            onClick={() => router.push("/pricing")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            View Pricing
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => router.push("/")}
          >
            Return Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
