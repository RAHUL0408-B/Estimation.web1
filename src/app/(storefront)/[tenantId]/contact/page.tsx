"use client";

import { use, useEffect, useState } from "react";
import { Loader2, MapPin, Clock, Phone, Mail, MessageCircle, Instagram, Facebook } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getTenantByStoreId } from "@/lib/firestoreHelpers";
import type { ContactPageContent, BrandConfig, ThemeConfig } from "@/types/website";

export default function ContactPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: storeSlug } = use(params);

    const [loading, setLoading] = useState(true);
    const [contactContent, setContactContent] = useState<ContactPageContent | null>(null);
    const [brand, setBrand] = useState<BrandConfig | null>(null);
    const [theme, setTheme] = useState<ThemeConfig | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
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
                    const brandDoc = await getDoc(doc(db, "tenants", tenant.id, "brand", "config"));
                    if (brandDoc.exists()) {
                        setBrand(brandDoc.data() as BrandConfig);
                    }

                    const themeDoc = await getDoc(doc(db, "tenants", tenant.id, "theme", "config"));
                    if (themeDoc.exists()) {
                        setTheme(themeDoc.data() as ThemeConfig);
                    }

                    const contactDoc = await getDoc(doc(db, "tenants", tenant.id, "pages", "contact"));
                    if (contactDoc.exists()) {
                        setContactContent(contactDoc.data() as ContactPageContent);
                    }
                }
            } catch (error) {
                console.error("Error loading contact page:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [storeSlug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const primaryColor = theme?.primaryColor || "#ea580c";
    const secondaryColor = theme?.secondaryColor || "#1c1917";

    return (
        <div className="flex flex-col">
            <section className="py-16 text-center" style={{ backgroundColor: secondaryColor }}>
                <div className="container mx-auto px-4">
                    <h1 className="text-5xl font-bold text-white mb-4">Contact Us</h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Get in touch with us for your interior design needs
                    </p>
                </div>
            </section>

            <section className="container mx-auto px-4 py-24">
                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-8" style={{ color: secondaryColor }}>
                                Get In Touch
                            </h2>

                            <div className="space-y-6">
                                {contactContent?.address && (
                                    <div className="flex items-start gap-4">
                                        <MapPin className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                                        <div>
                                            <h3 className="font-semibold mb-1">Address</h3>
                                            <p className="text-gray-600 whitespace-pre-line">{contactContent.address}</p>
                                        </div>
                                    </div>
                                )}

                                {brand?.phone && (
                                    <div className="flex items-start gap-4">
                                        <Phone className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                                        <div>
                                            <h3 className="font-semibold mb-1">Phone</h3>
                                            <a href={`tel:${brand.phone}`} className="text-gray-600 hover:underline">
                                                {brand.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {brand?.email && (
                                    <div className="flex items-start gap-4">
                                        <Mail className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                                        <div>
                                            <h3 className="font-semibold mb-1">Email</h3>
                                            <a href={`mailto:${brand.email}`} className="text-gray-600 hover:underline">
                                                {brand.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {contactContent?.officeHours && (
                                    <div className="flex items-start gap-4">
                                        <Clock className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                                        <div>
                                            <h3 className="font-semibold mb-1">Office Hours</h3>
                                            <p className="text-gray-600">{contactContent.officeHours}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social Media */}
                        {(contactContent?.whatsappNumber || contactContent?.instagramUrl || contactContent?.facebookUrl) && (
                            <div>
                                <h3 className="font-semibold mb-4">Connect With Us</h3>
                                <div className="flex gap-4">
                                    {contactContent.whatsappNumber && (
                                        <a
                                            href={`https://wa.me/${contactContent.whatsappNumber.replace(/[^0-9]/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                            style={{ color: primaryColor }}
                                        >
                                            <MessageCircle className="h-6 w-6" />
                                        </a>
                                    )}
                                    {contactContent.instagramUrl && (
                                        <a
                                            href={contactContent.instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                            style={{ color: primaryColor }}
                                        >
                                            <Instagram className="h-6 w-6" />
                                        </a>
                                    )}
                                    {contactContent.facebookUrl && (
                                        <a
                                            href={contactContent.facebookUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                            style={{ color: primaryColor }}
                                        >
                                            <Facebook className="h-6 w-6" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div>
                        {contactContent?.googleMapEmbedLink ? (
                            <div className="h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
                                <iframe
                                    src={contactContent.googleMapEmbedLink}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: "400px" }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-500">Map not available</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
