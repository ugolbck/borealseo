import { createClient } from "@/libs/supabase/server";
import { CalendarTimeline } from "./calendar-timeline";
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
  startDate.setDate(startDate.getDate() - 1); // Include yesterday

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 6); // Next 6 days (total 7 days including yesterday)

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
  let keywordData: any[] = [];
  if (keywords.length > 0) {
    const result = await supabase
      .from("keywords")
      .select("keyword, search_volume, difficulty")
      .eq("website_id", websiteId)
      .in("keyword", keywords);
    keywordData = result.data || [];
  }

  // Fetch articles for these content plans
  const planIds = contentPlanData?.map(p => p.id) || [];
  let articles: any[] = [];
  if (planIds.length > 0) {
    const result = await supabase
      .from("articles")
      .select("id, content_plan_id")
      .in("content_plan_id", planIds);
    articles = result.data || [];
  }

  // Create a map of content by date
  const contentByDate = new Map();
  (contentPlanData || []).forEach((plan) => {
    const date = new Date(plan.scheduled_for);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    const kwData = keywordData?.find(k => k.keyword === plan.target_keyword);
    const article = articles?.find(a => a.content_plan_id === plan.id);

    contentByDate.set(dateKey, {
      id: plan.id,
      title: plan.title,
      keyword: plan.target_keyword,
      scheduledFor: date,
      status: plan.status,
      searchVolume: kwData?.search_volume || 0,
      difficulty: kwData?.difficulty || 50,
      articleId: article?.id || null,
      wordCount: plan.word_count || null,
      isEmpty: false,
    });
  });

  // Generate all 7 days with placeholders for missing dates
  const calendarItems = [];
  for (let i = -1; i <= 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (contentByDate.has(dateKey)) {
      calendarItems.push(contentByDate.get(dateKey));
    } else {
      calendarItems.push({
        id: `empty-${dateKey}`,
        title: "",
        keyword: "",
        scheduledFor: date,
        status: "empty",
        searchVolume: 0,
        difficulty: 0,
        articleId: null,
        wordCount: null,
        isEmpty: true,
      });
    }
  }

  // Filter for trial users: lock future content
  const filteredItems = access.isTrialing
    ? calendarItems.map((item) => {
        const itemDate = new Date(item.scheduledFor);
        itemDate.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Show yesterday, today, and tomorrow for trial users
        if (itemDate < today && itemDate.toDateString() !== new Date(today.setDate(today.getDate() - 1)).toDateString()) {
          return { ...item, isLocked: true };
        }
        if (itemDate > new Date(now.setDate(now.getDate() + 1))) {
          return { ...item, isLocked: true };
        }
        return item;
      })
    : calendarItems;

  return <CalendarTimeline items={filteredItems} />;
}
