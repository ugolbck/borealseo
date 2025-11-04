"use client";

import * as React from "react";
import { Calendar, FileText, Zap } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { ProjectSwitcher } from "@/components/project-switcher";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string | null;
    email: string;
    avatar?: string;
  };
  websites: {
    id: string;
    name: string;
    url: string;
  }[];
  activeWebsiteId: string;
  isTrialing?: boolean;
  trialDaysRemaining?: number;
}

export function AppSidebar({ user, websites, activeWebsiteId, isTrialing, trialDaysRemaining, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Calendar",
      href: "/dashboard",
      icon: Calendar,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Articles",
      href: "/dashboard/articles",
      icon: FileText,
      isActive: pathname?.startsWith("/dashboard/articles"),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher websites={websites} activeWebsiteId={activeWebsiteId} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title} className="h-9">
                <Link href={item.href} className="cursor-pointer">
                  <div className="flex aspect-square size-8 items-center justify-center shrink-0">
                    <item.icon className="size-4" />
                  </div>
                  <span className="text-xs">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        {isTrialing && trialDaysRemaining !== undefined && (
          <div className="px-3 py-2">
            <Link href="/pricing">
              <Button size="sm" className="w-full text-xs h-8 cursor-pointer">
                <Zap className="h-3 w-3 mr-1.5" />
                Upgrade • {trialDaysRemaining}d left
              </Button>
            </Link>
          </div>
        )}
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
