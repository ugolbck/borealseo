"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  daysRemaining: number;
  trialEndsAt: Date | null;
}

export function TrialBanner({ daysRemaining, trialEndsAt }: TrialBannerProps) {
  const formattedDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm">
              <span className="font-medium">Free Trial</span>
              {" • "}
              <span className="text-muted-foreground">
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                {formattedDate && ` (ends ${formattedDate})`}
              </span>
            </p>
          </div>

          <Link href="/pricing">
            <Button size="sm" variant="default" className="text-xs">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
