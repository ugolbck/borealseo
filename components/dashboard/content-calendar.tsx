import { createClient } from "@/libs/supabase/server";
import { ContentCalendarClient } from "./content-calendar-client";
import type { UserAccess } from "@/libs/subscription";

interface ContentCalendarProps {
  websiteId: string;
  access: UserAccess;
}

export async function ContentCalendar({ websiteId, access }: ContentCalendarProps) {
  const supabase = await createClient();

  // Calculate date range for content plan
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 1); // Include yesterday for safety

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7); // Next 7 days

  // Fetch content plan
  const { data: contentPlanData } = await supabase
    .from("content_plan")
    .select(`
      id,
      title,
      target_keyword,
      scheduled_for,
      status,
      word_count
    `)
    .eq("website_id", websiteId)
    .gte("scheduled_for", startDate.toISOString())
    .lte("scheduled_for", endDate.toISOString())
    .order("scheduled_for", { ascending: true });

  // Fetch associated keywords data
  const keywords = contentPlanData?.map(p => p.target_keyword) || [];
  const { data: keywordData } = await supabase
    .from("keywords")
    .select("keyword, search_volume, difficulty")
    .eq("website_id", websiteId)
    .in("keyword", keywords);

  // Fetch articles for these content plans
  const planIds = contentPlanData?.map(p => p.id) || [];
  const { data: articles } = await supabase
    .from("articles")
    .select("id, content_plan_id")
    .in("content_plan_id", planIds);

  // Combine data
  const calendarItems = (contentPlanData || []).map((plan) => {
    const kwData = keywordData?.find(k => k.keyword === plan.target_keyword);
    const article = articles?.find(a => a.content_plan_id === plan.id);

    return {
      id: plan.id,
      title: plan.title,
      keyword: plan.target_keyword,
      scheduledFor: new Date(plan.scheduled_for),
      status: plan.status,
      searchVolume: kwData?.search_volume || 0,
      difficulty: kwData?.difficulty || 50,
      articleId: article?.id || null,
      wordCount: plan.word_count || null,
    };
  });

  // Filter for trial users: only show first 2 days
  const filteredItems = access.isTrialing
    ? calendarItems.filter((item, index) => index < 2)
    : calendarItems;

  return (
    <ContentCalendarClient
      items={filteredItems}
      websiteId={websiteId}
      isTrialing={access.isTrialing}
      totalItems={calendarItems.length}
    />
  );
}
