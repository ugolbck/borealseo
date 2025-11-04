import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { dataForSEOClient } from "@/libs/dataforseo";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { websiteUrl, websiteName, description, targetAudience, initialKeywords } = await request.json();

    // Validate required fields
    if (!websiteUrl || !websiteName || !description || !targetAudience || !initialKeywords) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Parse keywords
    const keywordsArray = initialKeywords
      .split(",")
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    if (keywordsArray.length < 3) {
      return NextResponse.json({ error: "Please provide at least 3 keywords" }, { status: 400 });
    }

    // Check if user already completed onboarding
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("has_completed_onboarding, trial_started_at, trial_ends_at")
      .eq("id", user.id)
      .single();

    // If already completed, just create new website
    if (profile?.has_completed_onboarding) {
      const { data: website, error: websiteError } = await supabase
        .from("websites")
        .insert({
          user_id: user.id,
          name: websiteName,
          url: websiteUrl,
          description,
          target_audience: targetAudience,
          initial_keywords: keywordsArray,
        })
        .select()
        .single();

      if (websiteError || !website) {
        throw new Error("Failed to create website");
      }

      // Generate keywords and content plan
      await generateContentPlan(supabase, website.id, keywordsArray, targetAudience);

      return NextResponse.json({
        success: true,
        projectId: website.id,
        message: "New project created successfully!",
      });
    }

    // First-time onboarding: Update profile and start trial
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 2); // 2-day trial

    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        has_completed_onboarding: true,
        trial_started_at: trialStartDate.toISOString(),
        trial_ends_at: trialEndDate.toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw new Error("Failed to update profile");
    }

    // Create website
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .insert({
        user_id: user.id,
        name: websiteName,
        url: websiteUrl,
        description,
        target_audience: targetAudience,
        initial_keywords: keywordsArray,
      })
      .select()
      .single();

    if (websiteError || !website) {
      throw new Error("Failed to create website");
    }

    // Generate keywords and content plan
    await generateContentPlan(supabase, website.id, keywordsArray, targetAudience);

    return NextResponse.json({
      success: true,
      projectId: website.id,
      message: "Onboarding completed! Starting your 2-day trial.",
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

async function generateContentPlan(
  supabase: any,
  websiteId: string,
  seedKeywords: string[],
  targetAudience: string
) {
  try {
    // Research keywords using DataForSEO
    const researchResults = await dataForSEOClient.researchKeywords(seedKeywords, targetAudience);

    if (researchResults.length === 0) {
      console.warn("No keywords generated from DataForSEO");
      return;
    }

    // Insert keywords into database
    const keywordInserts = researchResults.map(kw => ({
      website_id: websiteId,
      keyword: kw.keyword,
      search_volume: kw.searchVolume,
      difficulty: kw.difficulty,
      is_auto_discovered: true,
    }));

    await supabase.from("keywords").insert(keywordInserts);

    // Generate 7-day content calendar from top 7 keywords
    const top7Keywords = researchResults.slice(0, 7);
    const contentPlanInserts = top7Keywords.map((kw, index) => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + index);

      return {
        website_id: websiteId,
        title: generateArticleTitle(kw.keyword),
        target_keyword: kw.keyword,
        scheduled_for: scheduledDate.toISOString(),
        status: "planned",
      };
    });

    await supabase.from("content_plan").insert(contentPlanInserts);

    console.log(`Generated content plan with ${top7Keywords.length} articles`);
  } catch (error) {
    console.error("Error generating content plan:", error);
    // Don't fail onboarding if keyword generation fails
  }
}

function generateArticleTitle(keyword: string): string {
  const templates = [
    `The Complete Guide to ${keyword}`,
    `How to Master ${keyword} in 2024`,
    `${keyword}: Everything You Need to Know`,
    `Top 10 ${keyword} Tips for Beginners`,
    `The Ultimate ${keyword} Tutorial`,
    `${keyword} Best Practices and Examples`,
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.charAt(0).toUpperCase() + template.slice(1);
}
