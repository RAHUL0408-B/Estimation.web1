"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, CheckCircle, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { getTenantByStoreId } from "@/lib/firestoreHelpers";
import HeroSlider from "@/components/storefront/HeroSlider";
import TestimonialSlider from "@/components/storefront/TestimonialSlider";
import PortfolioCard from "@/components/storefront/PortfolioCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { HomePageContent, BrandConfig, ThemeConfig, PortfolioProject, Testimonial } from "@/types/website";

interface StorefrontPageProps {
    params: Promise<{ tenantId: string }>;
}

export default function StorefrontPage({ params }: StorefrontPageProps) {
    const { tenantId: storeSlug } = use(params);

    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [brand, setBrand] = useState<BrandConfig | null>(null);
    const [theme, setTheme] = useState<ThemeConfig | null>(null);
    const [homeContent, setHomeContent] = useState<HomePageContent | null>(null);
    const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    // Initialize scroll animations
    useScrollAnimation([loading]);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!storeSlug) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                // Resolve tenant ID from store slug
                const tenant = await getTenantByStoreId(storeSlug);
                if (!tenant) {
                    if (isMounted) setLoading(false);
                    return;
                }

                if (isMounted) setTenantId(tenant.id);

                // Load brand
                const brandDoc = await getDoc(doc(db, "tenants", tenant.id, "brand", "config"));
                if (isMounted && brandDoc.exists()) {
                    setBrand(brandDoc.data() as BrandConfig);
                }

                // Load theme
                const themeDoc = await getDoc(doc(db, "tenants", tenant.id, "theme", "config"));
                if (isMounted && themeDoc.exists()) {
                    setTheme(themeDoc.data() as ThemeConfig);
                }

                // Load home page content
                const homeDoc = await getDoc(doc(db, "tenants", tenant.id, "pages", "home"));
                if (isMounted && homeDoc.exists()) {
                    setHomeContent(homeDoc.data() as HomePageContent);
                }

                // Load portfolio projects (only those marked for homepage)
                const portfolioQuery = query(
                    collection(db, "tenants", tenant.id, "pages", "portfolio", "projects"),
                    where("showOnHomepage", "==", true),
                    orderBy("order", "asc")
                );
                const portfolioSnapshot = await getDocs(portfolioQuery);
                const projects = portfolioSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as PortfolioProject))
                    .slice(0, 6);
                if (isMounted) setPortfolioProjects(projects);

                // Load testimonials (only those marked for homepage)
                const testimonialsQuery = query(
                    collection(db, "tenants", tenant.id, "pages", "testimonials", "items"),
                    where("showOnHomepage", "==", true),
                    orderBy("order", "asc")
                );
                const testimonialsSnapshot = await getDocs(testimonialsQuery);
                const testimonialsList = testimonialsSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Testimonial))
                    .slice(0, 6);
                if (isMounted) setTestimonials(testimonialsList);

            } catch (error) {
                console.error("Error loading page data:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [storeSlug]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20 bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">Loading amazing spaces...</p>
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20 text-center px-4 bg-gray-50">
                <h1 className="text-4xl font-bold mb-4 text-gray-900">Store Not Found</h1>
                <p className="text-gray-600 max-w-md">We couldn't find the store "{storeSlug}". Please check the URL and try again.</p>
                <Link href="/">
                    <Button className="mt-6" variant="outline">Back to Home</Button>
                </Link>
            </div>
        );
    }

    const primaryColor = theme?.primaryColor || "#0F172A";
    const secondaryColor = theme?.secondaryColor || "#1c1917";
    const accentColor = theme?.accentColor || "#f59e0b";
    const buttonRadius = theme?.buttonRadius || 12;

    return (
        <div className="flex flex-col bg-white">
            {/* Hero Slider */}
            <HeroSlider
                slides={homeContent?.heroSlides || []}
                primaryColor={primaryColor}
            />

            {/* About Preview Section */}
            {homeContent?.aboutPreview && homeContent.aboutPreview.title && (
                <section
                    className="container mx-auto py-32 px-4 opacity-0 translate-y-8 transition-all duration-700"
                    data-scroll-animate
                >
                    <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                        <div className="space-y-6">
                            <h2 className="text-5xl font-bold leading-tight" style={{ color: secondaryColor }}>
                                {homeContent.aboutPreview.title}
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {homeContent.aboutPreview.description}
                            </p>
                            <Link href={`/${storeSlug}/about`}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-xl border-2 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                                    style={{ borderRadius: `${buttonRadius}px` }}
                                >
                                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        {homeContent.aboutPreview.imageUrl && (
                            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                                <img
                                    src={homeContent.aboutPreview.imageUrl}
                                    alt={homeContent.aboutPreview.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Portfolio Preview Section */}
            {portfolioProjects.length > 0 && (
                <section
                    className="py-32 bg-gradient-to-b from-white to-gray-50 opacity-0 translate-y-8 transition-all duration-700"
                    data-scroll-animate
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-5xl font-bold" style={{ color: secondaryColor }}>
                                Our Portfolio
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                                Explore our recent projects and see how we transform spaces
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                            {portfolioProjects.map((project, index) => (
                                <PortfolioCard key={project.id} project={project} index={index} />
                            ))}
                        </div>
                        <div className="text-center mt-12">
                            <Link href={`/${storeSlug}/portfolio`}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                                    style={{ borderRadius: `${buttonRadius}px` }}
                                >
                                    View All Projects <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials Section */}
            {testimonials.length > 0 && (
                <section
                    className="py-32 bg-white opacity-0 translate-y-8 transition-all duration-700"
                    data-scroll-animate
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-5xl font-bold" style={{ color: secondaryColor }}>
                                Client Testimonials
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                                Hear what our satisfied clients have to say about their experience
                            </p>
                        </div>

                        <TestimonialSlider testimonials={testimonials} accentColor={accentColor} />

                        <div className="text-center mt-12">
                            <Link href={`/${storeSlug}/testimonials`}>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
                                    style={{ borderRadius: `${buttonRadius}px` }}
                                >
                                    View All Testimonials <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Add global styles for scroll animations */}
            <style jsx global>{`
                [data-scroll-animate] {
                    opacity: 0;
                    transform: translateY(30px);
                }
                
                [data-scroll-animate].scroll-animate-active {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
}
