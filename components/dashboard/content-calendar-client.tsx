"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, TrendingUp, Loader2, FileText, Lock, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

interface CalendarItem {
  id: string;
  title: string;
  keyword: string;
  scheduledFor: Date;
  status: string;
  searchVolume: number;
  difficulty: number;
  articleId: string | null;
  wordCount: number | null;
}

interface ContentCalendarClientProps {
  items: CalendarItem[];
  websiteId: string;
  isTrialing: boolean;
  totalItems: number;
}

export function ContentCalendarClient({
  items,
  isTrialing,
  totalItems,
}: ContentCalendarClientProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerateArticle = async (planId: string) => {
    setGeneratingId(planId);
    try {
      const response = await fetch(`/api/articles/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentPlanId: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate article");
      }

      toast.success("Article generated successfully!");
      window.location.reload(); // Refresh to show new article
    } catch (error: any) {
      toast.error(error.message || "Failed to generate article");
    } finally {
      setGeneratingId(null);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">
          No content scheduled yet. Complete onboarding to generate your content plan.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Content Plan</h2>
        {isTrialing && (
          <Badge variant="secondary" className="text-xs">
            Trial: Showing 2 of {totalItems} days
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const dayNumber = index + 1;
          const isGenerating = generatingId === item.id;

          return (
            <Card
              key={item.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      Day {dayNumber}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatDate(item.scheduledFor)}
                      </div>
                      <h3 className="font-medium text-sm leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {item.keyword}
                    </Badge>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {item.searchVolume.toLocaleString()} vol
                      </span>
                      <span>•</span>
                      <span>Difficulty: {item.difficulty}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.articleId ? (
                      <Link href={`/dashboard/articles/${item.articleId}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          <FileText className="h-3 w-3 mr-1.5" />
                          View Article
                          {item.wordCount && (
                            <span className="ml-1.5 text-muted-foreground">
                              ({item.wordCount} words)
                            </span>
                          )}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateArticle(item.id)}
                        disabled={isGenerating}
                        className="text-xs h-8"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            Generate Article
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {isTrialing && totalItems > 2 && (
        <Card className="p-6 text-center bg-muted/50">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Unlock {totalItems - 2} more days of content by upgrading
          </p>
          <Link href="/pricing">
            <Button size="sm" className="btn-gradient">
              View Pricing
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
