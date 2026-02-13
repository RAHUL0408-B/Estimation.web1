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
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
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
                        <Label>Google Maps Embed Link</Label>
                        <Input
                            name="googleMapEmbedLink"
                            value={formData.googleMapEmbedLink}
                            onChange={handleInputChange}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                        <p className="text-xs text-gray-500">
                            Go to Google Maps → Share → Embed a map → Copy the iframe src URL
                        </p>
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
