import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get user's websites
  const { data: websites } = await supabase
    .from("websites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!websites || websites.length === 0) {
    redirect("/onboarding");
  }

  const website = websites[0]; // Use first website for now

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <ContentCalendar websiteId={website.id} />
    </Suspense>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
