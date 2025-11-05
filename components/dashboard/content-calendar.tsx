import { createClient } from "@/libs/supabase/server";
import { CalendarTimeline } from "./calendar-timeline";
import { assignKeywordsToDates, getUnusedKeywordCount } from "@/libs/content-generation-new";

interface ContentCalendarProps {
  websiteId: string;
}

export async function ContentCalendar({ websiteId }: ContentCalendarProps) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Calculate date range for content plan
  // Show: 3 past days + today + 6 future days = 10 cards total
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to midnight

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 3); // 3 days before today

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 6); // 6 days after today

  // Fetch content plans with keyword data via JOIN
  const { data: contentPlanData } = await supabase
    .from("content_plan")
    .select(`
      id,
      title,
      target_keyword,
      scheduled_for,
      scheduled_date,
      status,
      word_count,
      keywords:keyword_id (
        id,
        keyword,
        search_volume,
        seo_difficulty
      )
    `)
    .eq("website_id", websiteId)
    .gte("scheduled_for", startDate.toISOString())
    .lte("scheduled_for", endDate.toISOString())
    .order("scheduled_for", { ascending: true });

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
  (contentPlanData || []).forEach((plan: any) => {
    const date = new Date(plan.scheduled_for);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    const article = articles?.find(a => a.content_plan_id === plan.id);
    const kwData = plan.keywords; // From JOIN

    contentByDate.set(dateKey, {
      id: plan.id,
      title: plan.title,
      keyword: plan.target_keyword,
      scheduledFor: date,
      status: plan.status,
      searchVolume: kwData?.search_volume || 0,
      difficulty: kwData?.seo_difficulty || 50,
      articleId: article?.id || null,
      wordCount: plan.word_count || null,
      isEmpty: false,
    });
  });

  // Check if we have future empty slots and unused keywords
  // Count how many future dates (today onwards) are missing content plans
  let futureEmptyCount = 0;
  for (let i = 0; i <= 6; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    if (!contentByDate.has(dateKey)) {
      futureEmptyCount++;
    }
  }

  // If we have empty future slots, check if we have unused keywords
  if (futureEmptyCount > 0) {
    console.log(`📊 [DASHBOARD] Detected ${futureEmptyCount} empty future slots`);
    const unusedCount = await getUnusedKeywordCount(websiteId);
    console.log(`📊 [DASHBOARD] Found ${unusedCount} unused keywords in pool`);

    // Auto-assign keywords if we have both empty slots and unused keywords
    if (unusedCount > 0) {
      console.log(`🔄 [DASHBOARD] Auto-assigning keywords to fill empty slots...`);
      const assignResult = await assignKeywordsToDates(
        websiteId,
        user.id,
        now, // Start from today
        Math.min(futureEmptyCount, unusedCount) // Assign up to available slots or keywords
      );

      if (assignResult.success) {
        console.log(`✅ [DASHBOARD] Auto-assigned ${assignResult.plansCreated} keywords`);
        // Refetch content plans after assignment
        const { data: newContentPlanData } = await supabase
          .from("content_plan")
          .select(`
            id,
            title,
            target_keyword,
            scheduled_for,
            scheduled_date,
            status,
            word_count,
            keywords:keyword_id (
              id,
              keyword,
              search_volume,
              seo_difficulty
            )
          `)
          .eq("website_id", websiteId)
          .gte("scheduled_for", startDate.toISOString())
          .lte("scheduled_for", endDate.toISOString())
          .order("scheduled_for", { ascending: true });

        // Refetch articles
        const newPlanIds = newContentPlanData?.map(p => p.id) || [];
        let newArticles: any[] = [];
        if (newPlanIds.length > 0) {
          const result = await supabase
            .from("articles")
            .select("id, content_plan_id")
            .in("content_plan_id", newPlanIds);
          newArticles = result.data || [];
        }

        // Rebuild contentByDate map
        contentByDate.clear();
        (newContentPlanData || []).forEach((plan: any) => {
          const date = new Date(plan.scheduled_for);
          date.setHours(0, 0, 0, 0);
          const dateKey = date.toISOString().split('T')[0];

          const article = newArticles?.find(a => a.content_plan_id === plan.id);
          const kwData = plan.keywords;

          contentByDate.set(dateKey, {
            id: plan.id,
            title: plan.title,
            keyword: plan.target_keyword,
            scheduledFor: date,
            status: plan.status,
            searchVolume: kwData?.search_volume || 0,
            difficulty: kwData?.seo_difficulty || 50,
            articleId: article?.id || null,
            wordCount: plan.word_count || null,
            isEmpty: false,
          });
        });
      } else {
        console.error(`❌ [DASHBOARD] Failed to auto-assign keywords:`, assignResult.error);
      }
    }
  }

  // Generate all 10 days (3 past + today + 6 future) with placeholders for missing dates
  const calendarItems: any[] = [];
  for (let i = -3; i <= 6; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    if (contentByDate.has(dateKey)) {
      calendarItems.push(contentByDate.get(dateKey));
    } else {
      // Empty placeholder (not skeleton - just empty card)
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

  return <CalendarTimeline items={calendarItems} />;
}
