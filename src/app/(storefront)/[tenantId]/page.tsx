"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { usePublicWebsiteConfig } from "@/hooks/useWebsiteConfig";
import { use } from "react";

export default function StorefrontPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { config, loading } = usePublicWebsiteConfig(tenantId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const primaryColor = config?.primaryColor || "#ea580c";
    const secondaryColor = config?.secondaryColor || "#1c1917";
    const heroImage = config?.heroImageUrl || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop";
    const heroHeading = config?.heroHeading || "Design your dream home with perfection.";
    const heroSubheading = config?.heroSubheading || "From modular kitchens to complete home renovations, we bring luxury and functionality together.";

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 text-center text-white">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={heroImage}
                        alt="Interior"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 max-w-4xl space-y-6">
                    <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium uppercase tracking-wider backdrop-blur-md">
                        Premium Interior Services
                    </span>
                    <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                        {heroHeading}
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-200 sm:text-xl">
                        {heroSubheading}
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href={`/${tenantId}/login?redirect=/${tenantId}/estimate`}>
                            <Button size="lg" className="h-14 rounded-full px-10 text-lg text-white" style={{ backgroundColor: primaryColor }}>
                                Get Instant Estimate <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href={`/${tenantId}/book-consultation`}>
                            <Button size="lg" variant="outline" className="h-14 rounded-full border-white px-10 text-lg text-white hover:bg-white/10">
                                Book Consultation
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto py-24 px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4" style={{ color: secondaryColor }}>Why Choose Us</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">We deliver excellence in every project with attention to detail and commitment to quality.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-2xl border bg-card text-center shadow-sm transition-all hover:shadow-xl">
                        <div className="h-48 overflow-hidden bg-gray-100">
                            <img
                                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?w=800"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                alt="Design"
                            />
                        </div>
                        <div className="p-8">
                            <h3 className="mb-2 text-xl font-bold">Precision Design</h3>
                            <p className="text-muted-foreground">3D visualization and detailed layout mapping for every inch.</p>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-2xl border bg-card text-center shadow-sm transition-all hover:shadow-xl">
                        <div className="h-48 overflow-hidden bg-gray-100">
                            <img
                                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                alt="Materials"
                            />
                        </div>
                        <div className="p-8">
                            <h3 className="mb-2 text-xl font-bold">Premium Finishes</h3>
                            <p className="text-muted-foreground">High-grade materials with 10-year warranty assurances.</p>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-2xl border bg-card text-center shadow-sm transition-all hover:shadow-xl">
                        <div className="h-48 overflow-hidden bg-gray-100">
                            <img
                                src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                alt="Delivery"
                            />
                        </div>
                        <div className="p-8">
                            <h3 className="mb-2 text-xl font-bold">Timely Delivery</h3>
                            <p className="text-muted-foreground">Move in on time. We adhere strictly to project timelines.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 text-center text-white" style={{ backgroundColor: secondaryColor }}>
                <div className="container mx-auto px-4">
                    <h2 className="mb-6 font-serif text-4xl font-bold">Ready to transform your space?</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-gray-300">
                        Start by getting an estimate for your requirements. It takes less than 2 minutes.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href={`/${tenantId}/login?redirect=/${tenantId}/estimate`}>
                            <Button size="lg" className="h-14 rounded-full px-10 text-lg text-white" style={{ backgroundColor: primaryColor }}>
                                Get Your Estimate
                            </Button>
                        </Link>
                        <Link href={`/${tenantId}/book-consultation`}>
                            <Button size="lg" variant="outline" className="h-14 rounded-full border-gray-600 px-10 text-lg text-gray-300 hover:bg-white/10 hover:text-white">
                                Book Consultation
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
