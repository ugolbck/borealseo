import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log(`\n🔄 [CHANGE KEYWORD] Starting keyword change request`);

  try {
    const supabase = await createClient();
    const { contentPlanId } = await req.json();

    console.log(`   - Content Plan ID: ${contentPlanId}`);

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error(`❌ [AUTH] No authenticated user`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`✅ [AUTH] User authenticated: ${user.id}`);

    // Get the content plan to find the website_id
    console.log(`📋 [FETCH] Getting content plan details...`);
    const { data: contentPlan, error: planError } = await supabase
      .from("content_plan")
      .select("website_id, target_keyword, keyword_id")
      .eq("id", contentPlanId)
      .single();

    if (planError || !contentPlan) {
      console.error(`❌ [FETCH] Content plan not found:`, planError);
      return NextResponse.json(
        { error: "Content plan not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [FETCH] Content plan found`);
    console.log(`   - Website ID: ${contentPlan.website_id}`);
    console.log(`   - Current keyword: "${contentPlan.target_keyword}"`);

    // Verify the website belongs to the user
    console.log(`🔐 [AUTHZ] Verifying website ownership...`);
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id")
      .eq("id", contentPlan.website_id)
      .eq("user_id", user.id)
      .single();

    if (websiteError || !website) {
      console.error(`❌ [AUTHZ] User not authorized for this website`);
      return NextResponse.json(
        { error: "Not authorized to modify this content plan" },
        { status: 403 }
      );
    }

    console.log(`✅ [AUTHZ] User authorized`);

    // Get all keywords currently used in content plans (using keyword_id, not keyword string)
    console.log(`\n🔍 [POOL] Finding unused keywords...`);
    const { data: usedInPlans } = await supabase
      .from("content_plan")
      .select("keyword_id")
      .eq("website_id", contentPlan.website_id)
      .not("keyword_id", "is", null);

    const usedKeywordIds = new Set(
      usedInPlans?.map((p) => p.keyword_id) || []
    );

    console.log(`   - Keywords already in content plans: ${usedKeywordIds.size}`);

    // Get all keywords for this website
    const { data: allKeywords, error: keywordsError } = await supabase
      .from("keywords")
      .select("id, keyword, search_volume, seo_difficulty, score")
      .eq("website_id", contentPlan.website_id);

    if (keywordsError || !allKeywords || allKeywords.length === 0) {
      console.error(`❌ [POOL] No keywords in pool:`, keywordsError);
      return NextResponse.json(
        { error: "No keywords available" },
        { status: 404 }
      );
    }

    console.log(`   - Total keywords in pool: ${allKeywords.length}`);

    // Filter out keywords already used in any content plan
    const availableKeywords = allKeywords.filter(
      (kw) => !usedKeywordIds.has(kw.id)
    );

    console.log(`   - Available (unused) keywords: ${availableKeywords.length}`);

    if (availableKeywords.length === 0) {
      console.error(`❌ [POOL] No unused keywords available`);
      return NextResponse.json(
        { error: "No unused keywords available. All keywords are assigned to content plans." },
        { status: 404 }
      );
    }

    // Select a completely random keyword from ALL available unused keywords
    console.log(`\n🎲 [SELECTION] Selecting random keyword from pool...`);
    console.log(`   - Available unused keywords: ${availableKeywords.length}`);

    // Select a random keyword from ALL available keywords
    const randomIndex = Math.floor(Math.random() * availableKeywords.length);
    const randomKeyword = availableKeywords[randomIndex];

    console.log(`✅ [SELECTION] Selected: "${randomKeyword.keyword}"`);
    console.log(`   - Volume: ${randomKeyword.search_volume}`);
    console.log(`   - Difficulty: ${randomKeyword.seo_difficulty}`);
    console.log(`   - Score: ${randomKeyword.score}`);

    // Generate a new title
    const newTitle = `The Complete Guide to ${
      randomKeyword.keyword.charAt(0).toUpperCase() + randomKeyword.keyword.slice(1)
    }`;

    // Update the content plan with the new keyword
    console.log(`\n💾 [UPDATE] Updating content plan...`);
    const { data: updatedPlan, error: updateError } = await supabase
      .from("content_plan")
      .update({
        target_keyword: randomKeyword.keyword,
        keyword_id: randomKeyword.id,
        title: newTitle,
      })
      .eq("id", contentPlanId)
      .select("id, title, target_keyword")
      .single();

    if (updateError) {
      console.error(`❌ [UPDATE] Failed to update:`, updateError);
      return NextResponse.json(
        { error: "Failed to update content plan" },
        { status: 500 }
      );
    }

    console.log(`✅ [UPDATE] Content plan updated successfully`);
    console.log(`   - Old keyword: "${contentPlan.target_keyword}"`);
    console.log(`   - New keyword: "${updatedPlan.target_keyword}"`);

    // Return the new keyword data
    console.log(`✅ [CHANGE KEYWORD] Complete\n`);
    return NextResponse.json({
      success: true,
      contentPlan: {
        id: updatedPlan.id,
        title: updatedPlan.title,
        keyword: updatedPlan.target_keyword,
        searchVolume: randomKeyword.search_volume,
        difficulty: randomKeyword.seo_difficulty,
      },
    });
  } catch (error: any) {
    console.error(`\n❌ [FATAL ERROR] Change keyword failed`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack:`, error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
