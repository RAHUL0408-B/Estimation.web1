"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ADMIN_ITEMS = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Companies", href: "/admin/designers", icon: Building2 },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 border-r bg-slate-900 text-slate-50">
                <div className="flex h-16 items-center px-6">
                    <Shield className="mr-2 h-6 w-6 text-blue-400" />
                    <span className="text-xl font-bold tracking-tight">PlatformAdmin</span>
                </div>

                <nav className="mt-6 space-y-1 px-3">
                    {ADMIN_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href}>
                                <span className={cn(
                                    "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}>
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Button variant="destructive" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1">
                <header className="flex h-16 items-center justify-between border-b bg-white px-8 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">Super Admin Console</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">admin@platform.com</span>
                        <div className="h-8 w-8 rounded-full bg-blue-100 ring-2 ring-blue-500/20"></div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
