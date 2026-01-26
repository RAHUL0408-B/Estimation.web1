"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";
import { Copy, ExternalLink, Upload, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WebsiteSetupPage() {
    const { tenant } = useTenantAuth();
    const { config, loading, saving, saveConfig, uploadImage } = useWebsiteConfig(tenant?.id || null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        brandName: "",
        headerTitle: "",
        phone: "",
        email: "",
        primaryColor: "#ea580c",
        secondaryColor: "#1c1917",
        heroHeading: "",
        heroSubheading: "",
        footerText: "",
    });

    const [copied, setCopied] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const heroInputRef = useRef<HTMLInputElement>(null);

    // Sync form with config
    useEffect(() => {
        if (config) {
            setFormData({
                brandName: config.brandName || "",
                headerTitle: config.headerTitle || "",
                phone: config.phone || "",
                email: config.email || "",
                primaryColor: config.primaryColor || "#ea580c",
                secondaryColor: config.secondaryColor || "#1c1917",
                heroHeading: config.heroHeading || "",
                heroSubheading: config.heroSubheading || "",
                footerText: config.footerText || "",
            });
        }
    }, [config]);

    const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${tenant?.storeId || ""}`;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const url = await uploadImage(file, "logo");
        setUploadingLogo(false);

        if (url) {
            toast({ title: "Logo uploaded", description: "Your logo has been updated." });
        } else {
            toast({ title: "Upload failed", description: "Failed to upload logo.", variant: "destructive" });
        }
    };

    const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingHero(true);
        const url = await uploadImage(file, "hero");
        setUploadingHero(false);

        if (url) {
            toast({ title: "Hero image uploaded", description: "Your banner has been updated." });
        } else {
            toast({ title: "Upload failed", description: "Failed to upload hero image.", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        const success = await saveConfig(formData);
        if (success) {
            toast({ title: "Settings saved", description: "Your website has been updated." });
        } else {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        toast({ title: "Copied!", description: "Public URL copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    const openWebsite = () => {
        window.open(publicUrl, "_blank");
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Website Setup</h2>
                <p className="text-muted-foreground">Configure your public website branding and content</p>
            </div>

            {/* Public URL Card */}
            <Card className="bg-[#0F172A] text-white border-none">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <ExternalLink className="h-4 w-4 text-yellow-400" />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Public Website URL</span>
                            </div>
                            <p className="text-lg font-mono">{publicUrl}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={copyToClipboard} className="bg-white/10 hover:bg-white/20 text-white">
                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {copied ? "Copied" : "Copy"}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={openWebsite} className="bg-white text-black hover:bg-gray-100">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Website
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Brand Identity */}
            <Card>
                <CardHeader>
                    <CardTitle>Brand Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="brandName">Brand Name</Label>
                            <Input id="brandName" name="brandName" value={formData.brandName} onChange={handleInputChange} placeholder="Aviraj Interiors" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headerTitle">Header Title</Label>
                            <Input id="headerTitle" name="headerTitle" value={formData.headerTitle} onChange={handleInputChange} placeholder="Aviraj Interiors" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 99999 00000" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="hello@company.com" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Theme Colors */}
            <Card>
                <CardHeader>
                    <CardTitle>Theme Colors</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleInputChange} className="h-10 w-12 rounded border cursor-pointer" />
                                <Input name="primaryColor" value={formData.primaryColor} onChange={handleInputChange} className="font-mono uppercase" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleInputChange} className="h-10 w-12 rounded border cursor-pointer" />
                                <Input name="secondaryColor" value={formData.secondaryColor} onChange={handleInputChange} className="font-mono uppercase" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Media */}
            <Card>
                <CardHeader>
                    <CardTitle>Media</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Logo Upload */}
                        <div className="flex flex-col items-center">
                            <Label className="mb-4 text-sm font-medium">Logo</Label>
                            <div
                                className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden bg-gray-50"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                {uploadingLogo ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                ) : config?.logoUrl ? (
                                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Upload</p>
                                    </div>
                                )}
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </div>

                        {/* Hero Image Upload */}
                        <div className="flex-1">
                            <Label className="mb-4 text-sm font-medium block">Hero Background (1920x1080)</Label>
                            <div
                                className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden bg-gray-50"
                                onClick={() => heroInputRef.current?.click()}
                            >
                                {uploadingHero ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                ) : config?.heroImageUrl ? (
                                    <img src={config.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Upload hero image</p>
                                    </div>
                                )}
                            </div>
                            <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hero Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Hero Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="heroHeading">Hero Heading</Label>
                        <Input id="heroHeading" name="heroHeading" value={formData.heroHeading} onChange={handleInputChange} placeholder="Design your dream home with perfection." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="heroSubheading">Hero Subheading</Label>
                        <Textarea id="heroSubheading" name="heroSubheading" value={formData.heroSubheading} onChange={handleInputChange} placeholder="From modular kitchens to complete renovations..." rows={2} />
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <Card>
                <CardHeader>
                    <CardTitle>Footer</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="footerText">Footer Text</Label>
                        <Textarea id="footerText" name="footerText" value={formData.footerText} onChange={handleInputChange} placeholder="Transforming spaces into dreams." rows={2} />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </div>
    );
}
