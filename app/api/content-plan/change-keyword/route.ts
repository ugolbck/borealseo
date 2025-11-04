import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { contentPlanId } = await req.json();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the content plan to find the website_id
    const { data: contentPlan, error: planError } = await supabase
      .from("content_plan")
      .select("website_id, target_keyword")
      .eq("id", contentPlanId)
      .single();

    if (planError || !contentPlan) {
      return NextResponse.json(
        { error: "Content plan not found" },
        { status: 404 }
      );
    }

    // Verify the website belongs to the user
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id")
      .eq("id", contentPlan.website_id)
      .eq("user_id", user.id)
      .single();

    if (websiteError || !website) {
      return NextResponse.json(
        { error: "Not authorized to modify this content plan" },
        { status: 403 }
      );
    }

    // Get all keywords for this website, excluding the current one
    const { data: keywords, error: keywordsError } = await supabase
      .from("keywords")
      .select("id, keyword, search_volume, difficulty")
      .eq("website_id", contentPlan.website_id)
      .neq("keyword", contentPlan.target_keyword)
      .order("search_volume", { ascending: false })
      .limit(50);

    if (keywordsError || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: "No alternative keywords available" },
        { status: 404 }
      );
    }

    // Select a random keyword from the available ones
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    // Generate a new title based on the keyword (simple template for now)
    const newTitle = `${randomKeyword.keyword.charAt(0).toUpperCase() + randomKeyword.keyword.slice(1)}`;

    // Update the content plan with the new keyword
    const { data: updatedPlan, error: updateError } = await supabase
      .from("content_plan")
      .update({
        target_keyword: randomKeyword.keyword,
        keyword_id: randomKeyword.id,
        title: `The Complete Guide to ${newTitle}`,
      })
      .eq("id", contentPlanId)
      .select("id, title, target_keyword")
      .single();

    if (updateError) {
      console.error("Error updating content plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update content plan" },
        { status: 500 }
      );
    }

    // Return the new keyword data
    return NextResponse.json({
      success: true,
      contentPlan: {
        id: updatedPlan.id,
        title: updatedPlan.title,
        keyword: updatedPlan.target_keyword,
        searchVolume: randomKeyword.search_volume,
        difficulty: randomKeyword.difficulty,
      },
    });
  } catch (error) {
    console.error("Error changing keyword:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
