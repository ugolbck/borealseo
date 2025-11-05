import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ArticleEditor } from "@/components/editor/article-editor";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get article with related data
  const { data: article } = await supabase
    .from("articles")
    .select(`
      *,
      content_plan:content_plan_id (
        target_keyword,
        scheduled_for,
        websites (
          name,
          user_id
        )
      )
    `)
    .eq("id", articleId)
    .single();

  if (!article) {
    redirect("/dashboard/articles");
  }

  // Verify ownership
  if (article.content_plan?.websites?.user_id !== user.id) {
    redirect("/dashboard/articles");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/dashboard/articles"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Articles
      </Link>

      <Card className="p-6">
        <ArticleEditor article={article} />
      </Card>
    </div>
  );
}
