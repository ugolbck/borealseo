import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

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
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/dashboard/articles"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Articles
      </Link>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
              {article.meta_description && (
                <p className="text-sm text-muted-foreground">
                  {article.meta_description}
                </p>
              )}
            </div>
            <Badge variant={article.status === "published" ? "default" : "secondary"}>
              {article.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {article.content_plan?.target_keyword && (
              <Badge variant="outline" className="font-normal">
                {article.content_plan.target_keyword}
              </Badge>
            )}
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {article.word_count?.toLocaleString() || 0} words
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(article.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Separator />

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}
