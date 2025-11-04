"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CaretSortIcon } from "@radix-ui/react-icons";

export function ProjectSwitcher({
  websites,
  activeWebsiteId,
}: {
  websites: {
    id: string;
    name: string;
    url: string;
  }[];
  activeWebsiteId: string;
}) {
  const { isMobile } = useSidebar();
  const activeWebsite = websites.find((w) => w.id === activeWebsiteId) || websites[0];

  if (!activeWebsite) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer h-12"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
                <Globe className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-xs font-semibold">{activeWebsite.name}</span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {new URL(activeWebsite.url).hostname}
                </span>
              </div>
              <CaretSortIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Projects
            </DropdownMenuLabel>
            {websites.map((website) => (
              <DropdownMenuItem
                key={website.id}
                onClick={() => {
                  // Handle website switch - for now just reload
                  window.location.href = "/dashboard";
                }}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Globe className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm">{website.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new URL(website.url).hostname}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
