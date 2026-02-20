"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useContact } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ContactPageEditorProps {
    tenantId: string;
}

export default function ContactPageEditor({ tenantId }: ContactPageEditorProps) {
    const { contactContent, loading, saving, saveContactContent } = useContact(tenantId);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        address: "",
        googleMapEmbedLink: "",
        whatsappNumber: "",
        instagramUrl: "",
        facebookUrl: "",
        officeHours: "",
    });

    useEffect(() => {
        if (contactContent) {
            setFormData({
                address: contactContent.address || "",
                googleMapEmbedLink: contactContent.googleMapEmbedLink || "",
                whatsappNumber: contactContent.whatsappNumber || "",
                instagramUrl: contactContent.instagramUrl || "",
                facebookUrl: contactContent.facebookUrl || "",
                officeHours: contactContent.officeHours || "",
            });
        }
    }, [contactContent]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let processedValue = value;
        if (name === "googleMapEmbedLink" && value.includes("<iframe")) {
            // Automatically extract src if user pastes the whole iframe tag
            const match = value.match(/src="([^"]+)"/);
            if (match && match[1]) {
                processedValue = match[1];
            }
        }

        setFormData((prev) => ({ ...prev, [name]: processedValue }));
    };

    const handleSave = async () => {
        // Simple check for valid embed link
        if (formData.googleMapEmbedLink &&
            !formData.googleMapEmbedLink.includes("google.com/maps/embed") &&
            !formData.googleMapEmbedLink.includes("maps.google.com")) {
            toast({
                title: "Invalid Map Link",
                description: "Please use a valid Google Maps Embed link (it should contain 'google.com/maps/embed').",
                variant: "destructive"
            });
            return;
        }

        const success = await saveContactContent(formData);
        if (success) {
            toast({ title: "Saved", description: "Contact page updated successfully." });
        } else {
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Office Address</Label>
                        <Textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="123 Main Street, City, State, ZIP"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Google Maps Embed Link</Label>
                            {formData.googleMapEmbedLink && !formData.googleMapEmbedLink.includes("google.com/maps/embed") && (
                                <span className="text-[10px] font-bold text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded">Invalid Format</span>
                            )}
                        </div>
                        <Input
                            name="googleMapEmbedLink"
                            value={formData.googleMapEmbedLink}
                            onChange={handleInputChange}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                            className={cn(
                                "h-11 rounded-xl",
                                formData.googleMapEmbedLink && !formData.googleMapEmbedLink.includes("google.com/maps/embed") ? "border-rose-300 bg-rose-50" : ""
                            )}
                        />
                        <div className="mt-3 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/30">
                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 border-b border-blue-100">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">!</span>
                                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Designer Guide: How to add your Map</span>
                            </div>
                            <div className="p-4 pt-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-blue-400 uppercase">Step 1</p>
                                        <p className="text-[11px] text-blue-700 leading-tight">Search your business address on <b>Google Maps</b>.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-blue-400 uppercase">Step 2</p>
                                        <p className="text-[11px] text-blue-700 leading-tight">Click the <b>Share</b> button and select <b>"Embed a map"</b>.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-blue-400 uppercase">Step 3</p>
                                        <p className="text-[11px] text-blue-700 leading-tight">Click <b>"Copy HTML"</b> and just <b>Paste it above</b>. We'll do the rest!</p>
                                    </div>
                                </div>
                                <div className="mt-3 border-t border-blue-100 pt-2 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                    <p className="text-[10px] font-semibold text-blue-600">Pro-Tip: You don't need to find the specific link. Just copy the whole HTML and paste it.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Office Hours</Label>
                        <Input
                            name="officeHours"
                            value={formData.officeHours}
                            onChange={handleInputChange}
                            placeholder="Mon-Fri: 9:00 AM - 6:00 PM"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Social Media & Messaging</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>WhatsApp Number</Label>
                        <Input
                            name="whatsappNumber"
                            value={formData.whatsappNumber}
                            onChange={handleInputChange}
                            placeholder="+91 99999 00000"
                        />
                        <p className="text-xs text-gray-500">
                            Include country code (e.g., +91 for India)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Instagram URL</Label>
                        <Input
                            name="instagramUrl"
                            value={formData.instagramUrl}
                            onChange={handleInputChange}
                            placeholder="https://instagram.com/yourcompany"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Facebook URL</Label>
                        <Input
                            name="facebookUrl"
                            value={formData.facebookUrl}
                            onChange={handleInputChange}
                            placeholder="https://facebook.com/yourcompany"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end sticky bottom-6 z-10">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 rounded-xl shadow-lg h-12"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
