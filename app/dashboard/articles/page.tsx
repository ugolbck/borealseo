import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get all articles for user's websites
  const { data: articles } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      word_count,
      status,
      created_at,
      content_plan:content_plan_id (
        target_keyword,
        scheduled_for,
        websites (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Articles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All your generated SEO articles
        </p>
      </div>

      {!articles || articles.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">
            No articles yet. Generate your first article from the dashboard.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article: any) => (
            <Link key={article.id} href={`/dashboard/articles/${article.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-2 leading-snug">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {article.content_plan?.target_keyword && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {article.content_plan.target_keyword}
                        </Badge>
                      )}
                      {article.word_count && (
                        <span>{article.word_count.toLocaleString()} words</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {article.content_plan?.websites?.name && (
                      <div className="text-xs text-muted-foreground/50 mt-2">
                        {article.content_plan.websites.name}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={article.status === "published" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {article.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
