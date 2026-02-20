"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { HeroSlide } from "@/types/website";
import Image from "next/image";

interface HeroSliderProps {
    slides: HeroSlide[];
    primaryColor: string;
    tenantId: string;
}

export default function HeroSlider({ slides, primaryColor, tenantId }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Helper to resolve links within the tenant storefront
    const resolveLink = (link: string) => {
        if (!link || link === "#") return "#";

        // If it's an external link, return as is
        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:')) {
            return link;
        }

        // Special handling for the known pages to ensure they match header/footer
        const lowerLink = link.toLowerCase();
        if (lowerLink.includes('estimate')) return `/${tenantId}/estimate`;
        if (lowerLink.includes('consultation')) return `/${tenantId}/book-consultation`;
        if (lowerLink.includes('contact')) return `/${tenantId}/contact`;
        if (lowerLink.includes('portfolio')) return `/${tenantId}/portfolio`;

        // Cleaning the link for general resolution
        let cleanPath = link;
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

        // If the path already starts with the tenantId (case-insensitive check)
        if (cleanPath.toLowerCase().startsWith(tenantId.toLowerCase())) {
            // It might be "tenantId/path" - ensure it has exactly one leading slash
            const pathAfterTenant = cleanPath.substring(tenantId.length);
            const separator = pathAfterTenant.startsWith('/') ? '' : '/';
            return `/${tenantId}${separator}${pathAfterTenant.startsWith('/') ? pathAfterTenant.substring(1) : pathAfterTenant}`;
        }

        // Prepend tenantId for any other internal path
        return `/${tenantId}/${cleanPath}`;
    };

    // Auto-advance slides every 5 seconds
    useEffect(() => {
        if (slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev: number) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [slides.length]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev: number) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev: number) => (prev - 1 + slides.length) % slides.length);
    };

    if (slides.length === 0) {
        return (
            <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-4 text-center text-white bg-gray-900">
                <div className="relative z-10 max-w-4xl space-y-6">
                    <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                        Welcome to Our Interior Design Studio
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-200 sm:text-xl">
                        Transform your space into something extraordinary
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href={`/${tenantId}/estimate`}>
                            <button
                                className="h-14 rounded-full px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                                style={{ backgroundColor: primaryColor, color: '#fff' }}
                            >
                                Get Estimate
                            </button>
                        </Link>
                        <Link href={`/${tenantId}/book-consultation`}>
                            <button
                                className="h-14 rounded-full px-10 text-lg font-semibold bg-white/10 backdrop-blur-md border border-white/30 text-white shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                Book Consultation
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-black">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src={slide.imageUrl}
                            alt={slide.heading}
                            fill
                            priority={index === 0}
                            className="object-cover"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center text-white">
                        <div className="max-w-4xl space-y-8">
                            <span className="inline-block rounded-full bg-white/10 px-6 py-2 text-sm font-medium uppercase tracking-wider backdrop-blur-md border border-white/20 animate-fade-in">
                                Premium Interior Services
                            </span>
                            <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight sm:text-7xl animate-slide-up drop-shadow-lg">
                                {slide.heading}
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg text-gray-200 sm:text-xl animate-slide-up animation-delay-200 font-light leading-relaxed">
                                {slide.subheading}
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up animation-delay-400">
                                {slide.primaryButtonText && (
                                    <Link href={resolveLink(slide.primaryButtonLink)}>
                                        <button
                                            className="h-14 rounded-full px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                                            style={{ backgroundColor: primaryColor, color: '#fff' }}
                                        >
                                            {slide.primaryButtonText}
                                        </button>
                                    </Link>
                                )}
                                {slide.secondaryButtonText && (
                                    <Link href={resolveLink(slide.secondaryButtonLink)}>
                                        <button
                                            className="h-14 rounded-full px-10 text-lg font-semibold bg-white/10 backdrop-blur-md border border-white/30 text-white shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            {slide.secondaryButtonText}
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 backdrop-blur-md transition-all hover:bg-white/30"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-3 backdrop-blur-md transition-all hover:bg-white/30"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                </>
            )}

            {/* Dot Navigation */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? "w-8 bg-white"
                                : "w-2 bg-white/50 hover:bg-white/75"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
      `}</style>
        </section>
    );
}
