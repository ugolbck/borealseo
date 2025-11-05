"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export function DashboardNav() {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);

    if (pathname === "/dashboard") {
      return [{ label: "Calendar", href: "/dashboard", isActive: true }];
    }

    if (pathname.startsWith("/dashboard/articles")) {
      if (segments.length === 2) {
        return [
          { label: "Calendar", href: "/dashboard", isActive: false },
          { label: "Articles", href: "/dashboard/articles", isActive: true },
        ];
      }
      return [
        { label: "Calendar", href: "/dashboard", isActive: false },
        { label: "Articles", href: "/dashboard/articles", isActive: false },
        { label: "Article", href: pathname, isActive: true },
      ];
    }

    return [{ label: "Dashboard", href: "/dashboard", isActive: true }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 bg-card">
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.isActive ? (
                    <BreadcrumbPage className="text-xs">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="text-xs cursor-pointer">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

import * as React from "react";
