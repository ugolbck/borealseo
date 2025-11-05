"use client";

import { useState, useCallback, useEffect } from "react";
import { TiptapEditor } from "./tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Save, CheckCircle2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useBreadcrumb } from "../dashboard/breadcrumb-context";

interface ArticleEditorProps {
  article: {
    id: string;
    title: string;
    content: string;
    meta_description?: string;
    status: string;
    word_count?: number;
    created_at: string;
    content_plan?: {
      target_keyword?: string;
    };
  };
}

export function ArticleEditor({ article }: ArticleEditorProps) {
  const { setArticleTitle } = useBreadcrumb();

  // Set the article title in breadcrumb on mount
  useEffect(() => {
    setArticleTitle(article.title);
    return () => setArticleTitle(null);
  }, [article.title, setArticleTitle]);

  const [content, setContent] = useState(article.content);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedContent = useDebounce(content, 2000); // 2 second debounce

  const saveContent = useCallback(async (markdownContent: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/articles/${article.id}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: markdownContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save article:", error);
    } finally {
      setIsSaving(false);
    }
  }, [article.id]);

  // Auto-save when content changes (debounced)
  useEffect(() => {
    if (debouncedContent !== article.content) {
      saveContent(debouncedContent);
    }
  }, [debouncedContent, article.content, saveContent]);

  const wordCount = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <div className="flex items-center gap-2">
            <Badge variant={article.status === "published" ? "default" : "secondary"}>
              {article.status}
            </Badge>
            {isSaving ? (
              <Badge variant="outline" className="gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </Badge>
            ) : lastSaved ? (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Saved
              </Badge>
            ) : null}
          </div>
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
            {wordCount.toLocaleString()} words
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Editor */}
      <TiptapEditor
        content={content}
        onUpdate={setContent}
        placeholder="Start writing your article..."
      />
    </div>
  );
}
