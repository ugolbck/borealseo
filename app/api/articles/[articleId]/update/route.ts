import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  console.log(`\n💾 [ARTICLE UPDATE] Starting update request`);

  try {
    const { articleId } = await params;
    const supabase = await createClient();
    const { content } = await req.json();

    console.log(`   - Article ID: ${articleId}`);

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error(`❌ [AUTH] No authenticated user`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`✅ [AUTH] User authenticated: ${user.id}`);

    // Get the article with website info to verify ownership
    console.log(`📋 [FETCH] Getting article details...`);
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select(`
        id,
        content_plan:content_plan_id (
          website_id,
          websites (
            user_id
          )
        )
      `)
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      console.error(`❌ [FETCH] Article not found:`, articleError);
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [FETCH] Article found`);

    // Verify the website belongs to the user
    console.log(`🔐 [AUTHZ] Verifying article ownership...`);
    const websiteUserId = (article.content_plan as any)?.websites?.user_id;
    if (websiteUserId !== user.id) {
      console.error(`❌ [AUTHZ] User not authorized for this article`);
      return NextResponse.json(
        { error: "Not authorized to modify this article" },
        { status: 403 }
      );
    }

    console.log(`✅ [AUTHZ] User authorized`);

    // Calculate word count from Markdown
    // Remove markdown syntax: headers (#), bold (**), italic (*), links, etc.
    const wordCount = content
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links, keep text
      .replace(/`{3}[\s\S]*?`{3}/g, "") // Remove code blocks
      .replace(/`(.+?)`/g, "$1") // Remove inline code
      .replace(/>\s/g, "") // Remove blockquotes
      .replace(/[-*+]\s/g, "") // Remove list markers
      .replace(/\d+\.\s/g, "") // Remove numbered list markers
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    console.log(`📝 [UPDATE] Updating article...`);
    console.log(`   - Word count: ${wordCount}`);

    // Update the article
    const { data: updatedArticle, error: updateError } = await supabase
      .from("articles")
      .update({
        content,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId)
      .select("id, word_count, updated_at")
      .single();

    if (updateError) {
      console.error(`❌ [UPDATE] Failed to update:`, updateError);
      return NextResponse.json(
        { error: "Failed to update article" },
        { status: 500 }
      );
    }

    console.log(`✅ [UPDATE] Article updated successfully`);

    return NextResponse.json({
      success: true,
      article: updatedArticle,
    });
  } catch (error: any) {
    console.error(`\n❌ [FATAL ERROR] Article update failed`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack:`, error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
