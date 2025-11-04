import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { getUserAccess, needsUpgrade } from "@/libs/subscription";
import { PaywallModal } from "@/components/dashboard/paywall-modal";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardNav } from "@/components/dashboard/dashboard-nav-new";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Check if user completed onboarding
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("has_completed_onboarding")
    .eq("id", user.id)
    .single();

  if (!profile?.has_completed_onboarding) {
    redirect("/onboarding");
  }

  // Get user access info
  const access = await getUserAccess(user.id);
  const requiresUpgrade = await needsUpgrade(user.id);

  // Get user's websites for sidebar
  const { data: websites } = await supabase
    .from("websites")
    .select("id, name, url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const firstWebsite = websites?.[0];

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.user_metadata?.full_name || null,
          email: user.email!,
          avatar: user.user_metadata?.avatar_url,
        }}
        websites={websites || []}
        activeWebsiteId={firstWebsite?.id || ""}
        isTrialing={access.isTrialing}
        trialDaysRemaining={access.trialDaysRemaining}
      />
      <SidebarInset className="bg-background">
        <DashboardNav
          isTrialing={access.isTrialing}
          trialDaysRemaining={access.trialDaysRemaining}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
      {requiresUpgrade && <PaywallModal />}
    </SidebarProvider>
  );
}
