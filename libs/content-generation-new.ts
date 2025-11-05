import { createClient } from "@/libs/supabase/server";
import { dataForSEOClient } from "./dataforseo";

/**
 * NEW KEYWORD SYSTEM
 *
 * Phase 1: Build keyword pool (100-400 keywords)
 * Phase 2: Assign keywords to dates progressively
 * Phase 3: Display on timeline with proper empty states
 */

interface KeywordPoolResult {
  success: boolean;
  error?: string;
  keywordsGenerated?: number;
}

interface DailyAssignmentResult {
  success: boolean;
  error?: string;
  plansCreated?: number;
}

/**
 * Phase 1: Generate keyword pool from user's seed keywords
 * Called during onboarding
 */
export async function generateKeywordPool(
  websiteId: string,
  userId: string,
  seedKeywords: string[],
  targetAudience: string
): Promise<KeywordPoolResult> {
  console.log(`\n${'█'.repeat(80)}`)
  console.log(`🏗️  [KEYWORD POOL GENERATION] Phase 1 Starting`)
  console.log(`${'█'.repeat(80)}`)
  console.log(`Website ID: ${websiteId}`)
  console.log(`User ID: ${userId}`)
  console.log(`Seed keywords (${seedKeywords.length}): [${seedKeywords.join(', ')}]`)
  console.log(`Target audience: "${targetAudience}"`)

  const supabase = await createClient();

  try {
    // Validate input
    console.log(`\n✅ [VALIDATION] Checking seed keywords count...`)
    if (seedKeywords.length < 3 || seedKeywords.length > 15) {
      console.error(`❌ [VALIDATION] Invalid: ${seedKeywords.length} (must be 3-15)`)
      return {
        success: false,
        error: "Please provide between 3 and 15 seed keywords",
      };
    }
    console.log(`✅ [VALIDATION] OK: ${seedKeywords.length} seed keywords`)

    // Call DataForSEO research (handles expansion internally)
    console.log(`\n📞 [API] Calling researchKeywords()...`)
    const startTime = Date.now()

    const keywords = await dataForSEOClient.researchKeywords(
      seedKeywords,
      targetAudience,
      200
    );

    const duration = Date.now() - startTime
    console.log(`\n📊 [RESULT] Completed in ${duration}ms: ${keywords.length} keywords`);

    if (keywords.length === 0) {
      return {
        success: false,
        error: "No keywords found with difficulty < 35. Try different seed keywords.",
      };
    }

    // Add seed keyword to each keyword (best effort matching)
    const allKeywords = keywords.map(kw => {
      const matchingSeed = seedKeywords.find(seed =>
        kw.keyword.toLowerCase().includes(seed.toLowerCase())
      );
      return {
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        adsCompetition: kw.adsCompetition,
        seoDifficulty: kw.seoDifficulty,
        score: kw.score,
        seedKeyword: matchingSeed || seedKeywords[0], // Fallback to first seed
      };
    });

    console.log(`🎯 Selected top ${allKeywords.length} keywords by score`);

    // Insert into database with new field names
    const keywordsToInsert = allKeywords.map(kw => ({
      website_id: websiteId,
      keyword: kw.keyword,
      search_volume: kw.searchVolume,
      ads_competition: kw.adsCompetition,
      seo_difficulty: kw.seoDifficulty,
      seed_keyword: kw.seedKeyword,
      score: kw.score,
      status: "target" as const,
      is_auto_discovered: true,
    }));

    const { error: insertError } = await supabase
      .from("keywords")
      .insert(keywordsToInsert);

    if (insertError) {
      console.error("❌ Error inserting keywords:", insertError);
      return {
        success: false,
        error: "Failed to save keywords to database",
      };
    }

    console.log(`✅ Keyword pool created: ${allKeywords.length} keywords`);

    return {
      success: true,
      keywordsGenerated: allKeywords.length,
    };
  } catch (error) {
    console.error("Error in generateKeywordPool:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

/**
 * Phase 2: Assign keywords to specific dates (7 days at a time)
 * Called after keyword pool creation or when user reaches unassigned dates
 */
export async function assignKeywordsToDates(
  websiteId: string,
  userId: string,
  startDate: Date,
  numDays: number = 7
): Promise<DailyAssignmentResult> {
  const supabase = await createClient();

  try {
    console.log(`📅 Assigning keywords for ${numDays} days starting ${startDate.toISOString().split('T')[0]}`);

    // Get all keywords currently assigned to content plans
    const { data: existingPlans } = await supabase
      .from("content_plan")
      .select("keyword_id")
      .eq("website_id", websiteId)
      .not("keyword_id", "is", null);

    const usedKeywordIds = new Set(
      existingPlans?.map(p => p.keyword_id) || []
    );

    console.log(`🔒 ${usedKeywordIds.size} keywords already assigned`);

    // Get unused keywords from pool, sorted by score
    let query = supabase
      .from("keywords")
      .select("id, keyword, search_volume, seo_difficulty, score")
      .eq("website_id", websiteId);

    // Only filter by used keywords if there are any
    if (usedKeywordIds.size > 0) {
      query = query.not("id", "in", `(${Array.from(usedKeywordIds).join(',')})`);
    }

    const { data: availableKeywords, error: keywordsError } = await query.order("score", { ascending: false });

    if (keywordsError || !availableKeywords || availableKeywords.length === 0) {
      console.error("❌ No available keywords:", keywordsError);
      return {
        success: false,
        error: "No unused keywords available. Please generate more keywords.",
      };
    }

    console.log(`✅ ${availableKeywords.length} unused keywords in pool`);

    if (availableKeywords.length < numDays) {
      console.warn(`⚠️  Only ${availableKeywords.length} keywords available for ${numDays} days`);
      // We'll assign what we can
      numDays = availableKeywords.length;
    }

    // Create content plans for each date
    const plansToCreate = [];
    for (let i = 0; i < numDays; i++) {
      const planDate = new Date(startDate);
      planDate.setDate(planDate.getDate() + i);

      // Select a random keyword from available pool
      // This adds variety while still preferring high-score keywords (they're at the top)
      const maxIndex = Math.min(20, availableKeywords.length); // Top 20 for randomization
      const randomIndex = Math.floor(Math.random() * maxIndex);
      const selectedKeyword = availableKeywords[randomIndex];

      // Remove from available pool
      availableKeywords.splice(randomIndex, 1);

      // Generate title from keyword
      const title = `The Complete Guide to ${
        selectedKeyword.keyword.charAt(0).toUpperCase() +
        selectedKeyword.keyword.slice(1)
      }`;

      plansToCreate.push({
        website_id: websiteId,
        keyword_id: selectedKeyword.id,
        target_keyword: selectedKeyword.keyword, // Denormalized for easier queries
        scheduled_for: planDate.toISOString(),
        scheduled_date: planDate.toISOString().split('T')[0], // DATE only
        status: "planned" as const,
        title,
      });
    }

    // Insert content plans
    const { error: insertError, data: insertedPlans } = await supabase
      .from("content_plan")
      .insert(plansToCreate)
      .select();

    if (insertError) {
      console.error("❌ Error inserting content plans:", insertError);
      return {
        success: false,
        error: "Failed to create content plans",
      };
    }

    console.log(`✅ Created ${insertedPlans?.length || 0} content plans`);

    return {
      success: true,
      plansCreated: insertedPlans?.length || 0,
    };
  } catch (error) {
    console.error("Error in assignKeywordsToDates:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

/**
 * Helper: Check if user has enough keywords for next assignment
 * Returns number of unused keywords
 */
export async function getUnusedKeywordCount(
  websiteId: string
): Promise<number> {
  const supabase = await createClient();

  // Get all assigned keyword IDs
  const { data: existingPlans } = await supabase
    .from("content_plan")
    .select("keyword_id")
    .eq("website_id", websiteId)
    .not("keyword_id", "is", null);

  const usedKeywordIds = new Set(
    existingPlans?.map(p => p.keyword_id) || []
  );

  // Count total keywords
  const { count } = await supabase
    .from("keywords")
    .select("id", { count: "exact", head: true })
    .eq("website_id", websiteId);

  return (count || 0) - usedKeywordIds.size;
}

/**
 * Master function: Complete onboarding workflow
 * 1. Generate keyword pool
 * 2. Assign first 7 days
 */
export async function initializeContentPlan(
  websiteId: string,
  userId: string,
  seedKeywords: string[],
  targetAudience: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🚀 Initializing content plan for website ${websiteId}`);

  // Phase 1: Generate keyword pool
  const poolResult = await generateKeywordPool(
    websiteId,
    userId,
    seedKeywords,
    targetAudience
  );

  if (!poolResult.success) {
    return poolResult;
  }

  // Phase 2: Assign first 7 days starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight

  const assignResult = await assignKeywordsToDates(
    websiteId,
    userId,
    today,
    7
  );

  if (!assignResult.success) {
    return assignResult;
  }

  console.log(`✅ Content plan initialized successfully`);
  console.log(`   - Keywords in pool: ${poolResult.keywordsGenerated}`);
  console.log(`   - Days assigned: ${assignResult.plansCreated}`);

  return { success: true };
}
