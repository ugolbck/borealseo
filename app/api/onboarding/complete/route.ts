import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

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

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: "Active subscription required. Please subscribe to continue." },
        { status: 403 }
      );
    }

    // Check if user already completed onboarding
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .single();

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

    // Mark onboarding as complete if first time
    if (!profile?.has_completed_onboarding) {
      await supabase
        .from("user_profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", user.id);
    }

    // Generate initial content for this website using NEW system
    console.log("📅 Initializing content plan for website:", website.id);
    const { initializeContentPlan } = await import("@/libs/content-generation-new");
    const result = await initializeContentPlan(
      website.id,
      user.id,
      keywordsArray,
      targetAudience
    );

    if (!result.success) {
      console.error("Failed to initialize content plan:", result.error);
      // Don't fail the whole onboarding, just log the error
    } else {
      console.log(`✅ Content plan initialized successfully`);
    }

    return NextResponse.json({
      success: true,
      projectId: website.id,
      message: profile?.has_completed_onboarding
        ? "New project created successfully!"
        : "Setup complete! Your keywords are being generated.",
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
