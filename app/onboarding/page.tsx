import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Check if user already completed onboarding
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("has_completed_onboarding")
    .eq("id", user.id)
    .single();

  if (profile?.has_completed_onboarding) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Boreal SEO</h1>
          <p className="text-sm text-base-content/70">
            Let&apos;s set up your first project and start generating SEO content
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
