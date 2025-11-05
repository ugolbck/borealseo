"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  TrendingUp,
  Loader2,
  FileText,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/libs/utils";

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
  isEmpty?: boolean;
  isLocked?: boolean;
}

interface CalendarTimelineProps {
  items: CalendarItem[];
}

export function CalendarTimeline({ items: initialItems }: CalendarTimelineProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [changingKeywordId, setChangingKeywordId] = useState<string | null>(null);
  const [items, setItems] = useState<CalendarItem[]>(initialItems);

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
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate article");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleChangeKeyword = async (planId: string) => {
    setChangingKeywordId(planId);
    try {
      const response = await fetch(`/api/content-plan/change-keyword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentPlanId: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change keyword");
      }

      // Update the items state with the new keyword data
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === planId
            ? {
                ...item,
                title: data.contentPlan.title,
                keyword: data.contentPlan.keyword,
                searchVolume: data.contentPlan.searchVolume,
                difficulty: data.contentPlan.difficulty,
              }
            : item
        )
      );

      toast.success("Keyword changed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to change keyword");
    } finally {
      setChangingKeywordId(null);
    }
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
    });
  };

  // Find today's index to center the carousel
  // With 10 cards (3 past + today + 6 future), today should be at index 3
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIndex = items.findIndex((item) => {
    const itemDate = new Date(item.scheduledFor);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === today.getTime();
  });

  // Start carousel to show today in center
  // If we have 3 cards visible at a time, and today is at index 3,
  // we want to start at index 2 so today appears in position 1 (center of 3)
  const startIndex = Math.max(0, todayIndex > 0 ? todayIndex - 1 : 0);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No content scheduled yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-16">
      <Carousel
        opts={{
          align: "start",
          loop: false,
          startIndex,
        }}
        className="w-full max-w-6xl relative"
      >
        <CarouselContent className="-ml-4">
          {items.map((item) => {
            const isGenerating = generatingId === item.id;
            const isTodayCard = isToday(item.scheduledFor);

            return (
              <CarouselItem key={item.id} className="pl-4 md:basis-1/3 lg:basis-1/3">
                <Card
                  className={cn(
                    "transition-all duration-300 h-full",
                    isTodayCard &&
                      "shadow-[0_0_40px_rgba(13,148,136,0.15)] border-primary/40",
                    item.isEmpty && "opacity-50"
                  )}
                >
                    <CardContent className="p-6 space-y-4 h-full flex flex-col">
                      {/* Date header */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isTodayCard ? "default" : "secondary"}
                            className="text-[10px] font-medium"
                          >
                            {getDayLabel(item.scheduledFor)}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {formatFullDate(item.scheduledFor)}
                        </p>
                      </div>

                      <Separator />

                      {item.isEmpty ? (
                        <>
                          {/* Empty placeholder - no content assigned yet */}
                          <div className="flex-1 flex items-center justify-center text-center">
                            <p className="text-xs text-muted-foreground">
                              No content planned
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Keyword info */}
                          <div className="space-y-3 flex-1">
                            <div>
                              <Badge variant="outline" className="text-xs font-normal">
                                {item.keyword}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {item.searchVolume.toLocaleString()}
                              </span>
                              <span>•</span>
                              <span>Diff: {item.difficulty}/100</span>
                            </div>
                          </div>

                          <Separator />

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {item.articleId ? (
                              <Link href={`/dashboard/articles/${item.articleId}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs h-9 cursor-pointer"
                                >
                                  <FileText className="h-3.5 w-3.5 mr-2" />
                                  View Article
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleGenerateArticle(item.id)}
                                disabled={isGenerating}
                                className="w-full text-xs h-9"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                                    Generate Article
                                  </>
                                )}
                              </Button>
                            )}

                            {item.articleId && item.wordCount && (
                              <p className="text-[10px] text-center text-muted-foreground">
                                {item.wordCount} words
                              </p>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-xs h-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => handleChangeKeyword(item.id)}
                              disabled={changingKeywordId === item.id || !!item.articleId}
                            >
                              {changingKeywordId === item.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                  Changing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1.5" />
                                  Change Keyword
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="-left-12" />
        <CarouselNext className="-right-12" />
      </Carousel>
    </div>
  );
}
