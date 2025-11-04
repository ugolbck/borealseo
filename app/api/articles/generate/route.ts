import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contentPlanId } = await request.json();

    if (!contentPlanId) {
      return NextResponse.json({ error: "Content plan ID required" }, { status: 400 });
    }

    // Get content plan details
    const { data: contentPlan } = await supabase
      .from("content_plan")
      .select("*, websites(*)")
      .eq("id", contentPlanId)
      .single();

    if (!contentPlan) {
      return NextResponse.json({ error: "Content plan not found" }, { status: 404 });
    }

    // Verify ownership
    if (contentPlan.websites.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if article already exists
    const { data: existingArticle } = await supabase
      .from("articles")
      .select("id")
      .eq("content_plan_id", contentPlanId)
      .single();

    if (existingArticle) {
      return NextResponse.json({
        success: true,
        articleId: existingArticle.id,
        message: "Article already exists",
      });
    }

    // Generate article using OpenAI
    const article = await generateArticleContent({
      keyword: contentPlan.target_keyword,
      title: contentPlan.title,
      targetAudience: contentPlan.websites.target_audience,
      description: contentPlan.websites.description,
    });

    // Update content plan status
    await supabase
      .from("content_plan")
      .update({ status: "draft" })
      .eq("id", contentPlanId);

    // Insert article
    const { data: newArticle, error: insertError } = await supabase
      .from("articles")
      .insert({
        content_plan_id: contentPlanId,
        title: article.title,
        meta_description: article.metaDescription,
        content: article.content,
        word_count: article.wordCount,
        headings: article.headings,
        status: "draft",
      })
      .select()
      .single();

    if (insertError || !newArticle) {
      throw new Error("Failed to save article");
    }

    return NextResponse.json({
      success: true,
      articleId: newArticle.id,
      message: "Article generated successfully",
    });
  } catch (error: any) {
    console.error("Article generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate article" },
      { status: 500 }
    );
  }
}

async function generateArticleContent({
  keyword,
  title,
  targetAudience,
  description,
}: {
  keyword: string;
  title: string;
  targetAudience?: string;
  description?: string;
}): Promise<{
  title: string;
  metaDescription: string;
  content: string;
  wordCount: number;
  headings: string[];
}> {
  const currentYear = new Date().getFullYear();

  const prompt = `You are an expert SEO content writer. Generate a comprehensive, SEO-optimized blog article.

TARGET KEYWORD: ${keyword}
ARTICLE TITLE: ${title}
TARGET AUDIENCE: ${targetAudience || "general audience"}
PROJECT CONTEXT: ${description || "general blog"}

Requirements:
- Write in markdown format
- Include H2 and H3 headings (use ## for H2, ### for H3)
- Aim for 1500-2000 words
- Natural keyword placement (don't over-optimize)
- Write in an engaging, informative tone
- Include practical examples and actionable advice
- Use current year (${currentYear}) in time-sensitive content
- Make it valuable for ${targetAudience || "readers"}

Generate ONLY the article content in markdown format. Start directly with content (no title, as it's already provided).`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = completion.choices[0].message.content || "";

  // Extract headings
  const headings: string[] = [];
  const headingMatches = content.matchAll(/^#{2,3} (.+)$/gm);
  for (const match of headingMatches) {
    headings.push(match[1]);
  }

  // Calculate word count
  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;

  // Generate meta description
  const firstParagraph = content.split("\n\n")[0] || content.substring(0, 200);
  const metaDescription = firstParagraph
    .replace(/[#*_`]/g, "")
    .trim()
    .substring(0, 155) + (firstParagraph.length > 155 ? "..." : "");

  return {
    title,
    metaDescription,
    content,
    wordCount,
    headings,
  };
}
