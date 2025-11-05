import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { needsUpgrade } from "@/libs/subscription";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardNav } from "@/components/dashboard/dashboard-nav-new";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BreadcrumbProvider } from "@/components/dashboard/breadcrumb-context";

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

  // Check if user has active subscription
  const requiresUpgrade = await needsUpgrade(user.id);

  if (requiresUpgrade) {
    redirect("/pricing");
  }

  // Get user's websites for sidebar
  const { data: websites } = await supabase
    .from("websites")
    .select("id, name, url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Check if user has any websites (if not, redirect to onboarding)
  if (!websites || websites.length === 0) {
    redirect("/onboarding");
  }

  const firstWebsite = websites?.[0];

  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar
          user={{
            name: user.user_metadata?.full_name || null,
            email: user.email!,
            avatar: user.user_metadata?.avatar_url,
          }}
          websites={websites || []}
          activeWebsiteId={firstWebsite?.id || ""}
        />
        <SidebarInset className="bg-background">
          <DashboardNav />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
