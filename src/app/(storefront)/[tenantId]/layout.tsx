"use client";

import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { use, useState } from "react";
import { usePublicWebsiteConfig } from "@/hooks/useWebsiteConfig";

export default function StorefrontLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenantId: string }>;
}) {
    const { tenantId } = use(params);
    const { config, loading } = usePublicWebsiteConfig(tenantId);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const brandName = config?.headerTitle || config?.brandName || tenantId;
    const phone = config?.phone;
    const email = config?.email;
    const primaryColor = config?.primaryColor || "#ea580c";
    const secondaryColor = config?.secondaryColor || "#1c1917";
    const footerText = config?.footerText || "Transforming spaces into dreams.";

    return (
        <div className="flex min-h-screen flex-col font-sans">
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                    <Link href={`/${tenantId}`} className="flex items-center gap-3">
                        {config?.logoUrl && (
                            <img src={config.logoUrl} alt={brandName} className="h-10 w-10 rounded-full object-cover" />
                        )}
                        <span className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>
                            {brandName}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-8 md:flex">
                        <Link href={`/${tenantId}`} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Home
                        </Link>
                        <Link href={`/${tenantId}/login?redirect=/${tenantId}/estimate`} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Get Estimate
                        </Link>
                        <Link href={`/${tenantId}/portfolio`} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Portfolio
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {phone && (
                            <a href={`tel:${phone}`} className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                {phone}
                            </a>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <Link href={`/${tenantId}/book-consultation`}>
                            <Button className="hidden md:flex text-white" style={{ backgroundColor: primaryColor }}>
                                Book Consultation
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-white">
                        <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                            <Link href={`/${tenantId}`} className="py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                                Home
                            </Link>
                            <Link href={`/${tenantId}/login?redirect=/${tenantId}/estimate`} className="py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                                Get Estimate
                            </Link>
                            <Link href={`/${tenantId}/portfolio`} className="py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                                Portfolio
                            </Link>
                            <Link href={`/${tenantId}/book-consultation`} onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full mt-2 text-white" style={{ backgroundColor: primaryColor }}>
                                    Book Consultation
                                </Button>
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t py-12" style={{ backgroundColor: secondaryColor, color: "white" }}>
                <div className="container mx-auto grid grid-cols-1 gap-8 px-4 sm:grid-cols-3 md:px-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            {config?.logoUrl && (
                                <img src={config.logoUrl} alt={brandName} className="h-10 w-10 rounded-full object-cover" />
                            )}
                            <h3 className="text-lg font-bold">{brandName}</h3>
                        </div>
                        <p className="text-sm text-gray-300">{footerText}</p>
                    </div>
                    <div>
                        <h4 className="mb-4 font-medium">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><Link href={`/${tenantId}`} className="hover:text-white">Home</Link></li>
                            <li><Link href={`/${tenantId}/login?redirect=/${tenantId}/estimate`} className="hover:text-white">Get Estimate</Link></li>
                            <li><Link href={`/${tenantId}/portfolio`} className="hover:text-white">Portfolio</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-medium">Contact</h4>
                        {phone && <p className="text-sm text-gray-300 mb-1">{phone}</p>}
                        {email && <p className="text-sm text-gray-300 mb-1">{email}</p>}
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-700">
                    <p className="text-center text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
