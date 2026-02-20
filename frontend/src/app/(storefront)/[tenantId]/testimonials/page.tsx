"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Star, Quote } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getTenantByStoreId } from "@/lib/firestoreHelpers";
import type { Testimonial, ThemeConfig } from "@/types/website";

export default function TestimonialsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: storeSlug } = use(params);

    const [loading, setLoading] = useState(true);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [theme, setTheme] = useState<ThemeConfig | null>(null);

    useEffect(() => {
        let isMounted = true;
        let unsubs: (() => void)[] = [];

        const setupListeners = async () => {
            if (!storeSlug) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                const tenant = await getTenantByStoreId(storeSlug);
                if (!tenant) {
                    if (isMounted) setLoading(false);
                    return;
                }

                if (isMounted) {
                    // 1. Listen to Theme
                    const themeUnsub = onSnapshot(doc(db, "tenants", tenant.id, "theme", "config"), (doc) => {
                        if (isMounted && doc.exists()) {
                            setTheme(doc.data() as ThemeConfig);
                        }
                    });
                    unsubs.push(themeUnsub);

                    // 2. Listen to Testimonials
                    const testimonialsRef = collection(db, "tenants", tenant.id, "pages", "testimonials", "items");
                    const q = query(testimonialsRef, orderBy("order", "asc"));
                    const testimonialsUnsub = onSnapshot(q, (snapshot) => {
                        const testimonialsData = snapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Testimonial[];
                        if (isMounted) {
                            setTestimonials(testimonialsData);
                            setLoading(false);
                        }
                    });
                    unsubs.push(testimonialsUnsub);
                }
            } catch (error) {
                console.error("Error setting up testimonials listeners:", error);
                if (isMounted) setLoading(false);
            }
        };

        setupListeners();
        return () => {
            isMounted = false;
            unsubs.forEach(unsub => unsub());
        };
    }, [storeSlug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const secondaryColor = theme?.secondaryColor || "#1c1917";

    return (
        <div className="flex flex-col">
            <section className="py-16 text-center" style={{ backgroundColor: secondaryColor }}>
                <div className="container mx-auto px-4">
                    <h1 className="text-5xl font-bold text-white mb-4">Client Testimonials</h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Hear what our satisfied clients have to say about their experience
                    </p>
                </div>
            </section>

            <section className="container mx-auto px-4 py-24">
                {testimonials.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-lg">No testimonials available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100"
                            >
                                <Quote className="h-10 w-10 text-gray-300 mb-4" />
                                <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.reviewText}</p>
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${i < testimonial.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    {testimonial.clientImageUrl ? (
                                        <img
                                            src={testimonial.clientImageUrl}
                                            alt={testimonial.clientName}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-600 font-semibold text-lg">
                                                {testimonial.clientName.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold">{testimonial.clientName}</h4>
                                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
