"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Save } from "lucide-react";
import { useBrand } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";

interface BrandTabProps {
    tenantId: string;
}

export default function BrandTab({ tenantId }: BrandTabProps) {
    const { brand, loading, saving, saveBrand, uploadBrandImage } = useBrand(tenantId);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        brandName: "",
        headerTitle: "",
        phone: "",
        email: "",
    });

    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (brand) {
            setFormData({
                brandName: brand.brandName || "",
                headerTitle: brand.headerTitle || "",
                phone: brand.phone || "",
                email: brand.email || "",
            });
        }
    }, [brand]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const url = await uploadBrandImage(file, "logo");
        setUploadingLogo(false);

        if (url) {
            toast({ title: "Logo uploaded", description: "Your logo has been updated." });
        } else {
            toast({
                title: "Upload failed",
                description: "Failed to upload logo.",
                variant: "destructive",
            });
        }
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFavicon(true);
        const url = await uploadBrandImage(file, "favicon");
        setUploadingFavicon(false);

        if (url) {
            toast({ title: "Favicon uploaded", description: "Your favicon has been updated." });
        } else {
            toast({
                title: "Upload failed",
                description: "Failed to upload favicon.",
                variant: "destructive",
            });
        }
    };

    const handleSave = async () => {
        const success = await saveBrand(formData);
        if (success) {
            toast({ title: "Saved", description: "Brand settings have been updated." });
        } else {
            toast({
                title: "Error",
                description: "Failed to save brand settings.",
                variant: "destructive",
            });
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
            {/* Brand Identity */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Brand Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="brandName" className="text-sm font-medium">
                                Brand Name
                            </Label>
                            <Input
                                id="brandName"
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleInputChange}
                                placeholder="Aviraj Interiors"
                                className="h-11 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headerTitle" className="text-sm font-medium">
                                Header Title
                            </Label>
                            <Input
                                id="headerTitle"
                                name="headerTitle"
                                value={formData.headerTitle}
                                onChange={handleInputChange}
                                placeholder="Aviraj Interiors"
                                className="h-11 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+91 99999 00000"
                                className="h-11 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="hello@company.com"
                                className="h-11 rounded-lg"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logo & Favicon */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Logo & Favicon</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Logo</Label>
                            <div
                                className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-all overflow-hidden bg-gray-50 group"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                {uploadingLogo ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                ) : brand?.logoUrl ? (
                                    <>
                                        <img
                                            src={brand.logoUrl}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-8 w-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Upload Logo</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <p className="text-xs text-gray-500">
                                Recommended: Square image, 512x512px
                            </p>
                        </div>

                        {/* Favicon Upload */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Favicon</Label>
                            <div
                                className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-all overflow-hidden bg-gray-50 group"
                                onClick={() => faviconInputRef.current?.click()}
                            >
                                {uploadingFavicon ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                ) : brand?.faviconUrl ? (
                                    <>
                                        <img
                                            src={brand.faviconUrl}
                                            alt="Favicon"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-8 w-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Upload Favicon</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={faviconInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFaviconUpload}
                                className="hidden"
                            />
                            <p className="text-xs text-gray-500">
                                Recommended: Square image, 32x32px or 64x64px
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
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
