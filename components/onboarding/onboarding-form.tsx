"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    websiteUrl: "",
    websiteName: "",
    description: "",
    targetAudience: "",
    initialKeywords: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      toast.success("Project created! Generating your content strategy...");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      setLoading(false);
    }
  };

  const isFormValid =
    formData.websiteUrl &&
    formData.websiteName &&
    formData.description &&
    formData.targetAudience &&
    formData.initialKeywords.split(",").filter(k => k.trim()).length >= 3;

  return (
    <Card className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl" className="text-sm font-medium">
            Website URL
          </Label>
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://example.com"
            value={formData.websiteUrl}
            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            required
            disabled={loading}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteName" className="text-sm font-medium">
            Project Name
          </Label>
          <Input
            id="websiteName"
            placeholder="My Awesome Project"
            value={formData.websiteName}
            onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
            required
            disabled={loading}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Project Description
          </Label>
          <Textarea
            id="description"
            placeholder="Brief description of your website or app..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            disabled={loading}
            rows={3}
            className="text-sm resize-none"
          />
          <p className="text-xs text-base-content/60">
            This helps us generate relevant content for your audience
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-sm font-medium">
            Target Audience
          </Label>
          <Input
            id="targetAudience"
            placeholder="e.g., developers, small business owners, marketers"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            required
            disabled={loading}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialKeywords" className="text-sm font-medium">
            Seed Keywords
          </Label>
          <Textarea
            id="initialKeywords"
            placeholder="react, nextjs, web development"
            value={formData.initialKeywords}
            onChange={(e) => setFormData({ ...formData, initialKeywords: e.target.value })}
            required
            disabled={loading}
            rows={2}
            className="text-sm resize-none"
          />
          <p className="text-xs text-base-content/60">
            Enter at least 3 keywords separated by commas. We&apos;ll use these to find related keywords.
          </p>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your project...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start Your Free Trial
              </>
            )}
          </Button>
          <p className="text-xs text-center text-base-content/60 mt-3">
            2-day free trial • No credit card required
          </p>
        </div>
      </form>
    </Card>
  );
}
