"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Building2,
  Users,
  PhoneCall,
  FileCheck,
  LayoutDashboard
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Builder", icon: Home, testId: "nav_home" },
  { href: "/housing", label: "Wohnungen", icon: Building2, testId: "nav_housing" },
  { href: "/candidates", label: "Kandidaten", icon: Users, testId: "nav_candidates" },
  { href: "/negotiations", label: "Verhandlungen", icon: PhoneCall, testId: "nav_negotiations" },
  { href: "/deals", label: "Deals", icon: FileCheck, testId: "nav_deals" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 px-4" data-testid="main_navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={item.testId}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
