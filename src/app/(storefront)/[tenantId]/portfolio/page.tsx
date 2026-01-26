"use client";

import { use, useState, useEffect } from "react";
import { Loader2, Image as ImageIcon, X, ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react";
import { usePublicWebsiteConfig } from "@/hooks/useWebsiteConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface PortfolioProject {
    id: string;
    title: string;
    description?: string;
    images: string[];
    category?: string;
    location?: string;
    completionDate?: string;
    status?: string;
}

export default function PortfolioPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { config, tenantId: resolvedTenantId, loading: configLoading } = usePublicWebsiteConfig(tenantId);
    const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch portfolio items from top-level portfolio collection
    useEffect(() => {
        if (!resolvedTenantId) {
            setLoading(false);
            return;
        }

        // Query the top-level portfolio collection with tenantId filter
        const portfolioRef = collection(db, "portfolio");
        const q = query(
            portfolioRef,
            where("tenantId", "==", resolvedTenantId),
            where("status", "==", "active")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PortfolioProject[];

            // Sort by createdAt manually (to avoid composite index requirement)
            items.sort((a: any, b: any) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0;
            });

            setPortfolio(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching portfolio:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [resolvedTenantId]);

    const isLoading = configLoading || loading;
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const secondaryColor = config?.secondaryColor || "#1c1917";
    const primaryColor = config?.primaryColor || "#ea580c";

    const openLightbox = (images: string[], startIndex: number = 0) => {
        setLightboxImages(images);
        setLightboxIndex(startIndex);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxImages([]);
    };

    const nextImage = () => {
        setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
    };

    const prevImage = () => {
        setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="py-16 text-center" style={{ backgroundColor: secondaryColor }}>
                <div className="container mx-auto px-4">
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Our Latest Work</span>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mt-4">
                        Portfolio
                    </h1>
                    <p className="text-gray-300 max-w-2xl mx-auto mt-4">
                        Explore our collection of handpicked projects, showcasing our dedication to quality and design excellence.
                    </p>
                </div>
            </div>

            {/* Portfolio Grid */}
            <div className="container mx-auto py-16 px-4">
                {portfolio.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl">
                        <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Portfolio items coming soon.</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {portfolio.map((project) => (
                            <Card
                                key={project.id}
                                className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                                onClick={() => project.images && project.images.length > 0 && openLightbox(project.images)}
                            >
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    {project.images?.[0] ? (
                                        <img
                                            src={project.images[0]}
                                            alt={project.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <ImageIcon className="h-12 w-12 opacity-20" />
                                        </div>
                                    )}
                                    {project.category && (
                                        <div className="absolute bottom-4 left-4">
                                            <Badge className="bg-white/90 backdrop-blur text-gray-700 border-none uppercase text-[10px] font-bold px-3 py-1">
                                                {project.category}
                                            </Badge>
                                        </div>
                                    )}
                                    {project.images && project.images.length > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            +{project.images.length - 1} photos
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-xl group-hover:opacity-80 transition-opacity">
                                        {project.title}
                                    </h3>
                                    {(project.location || project.completionDate) && (
                                        <div className="flex items-center text-xs text-gray-400 mt-2 space-x-3">
                                            {project.location && (
                                                <div className="flex items-center">
                                                    <MapPin className="mr-1 h-3 w-3" /> {project.location}
                                                </div>
                                            )}
                                            {project.completionDate && (
                                                <div className="flex items-center">
                                                    <Calendar className="mr-1 h-3 w-3" /> {project.completionDate}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {project.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-3">
                                            {project.description}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    {lightboxImages.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 text-white hover:text-gray-300 z-10"
                            >
                                <ChevronLeft className="h-10 w-10" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 text-white hover:text-gray-300 z-10"
                            >
                                <ChevronRight className="h-10 w-10" />
                            </button>
                        </>
                    )}

                    <div className="max-w-5xl max-h-[90vh] px-4">
                        <img
                            src={lightboxImages[lightboxIndex]}
                            alt=""
                            className="max-w-full max-h-[85vh] object-contain mx-auto"
                        />
                        {lightboxImages.length > 1 && (
                            <p className="text-center text-white/70 mt-4 text-sm">
                                {lightboxIndex + 1} / {lightboxImages.length}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
