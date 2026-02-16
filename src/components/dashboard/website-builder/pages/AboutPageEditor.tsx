"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Upload,
    Loader2,
    Save,
    Linkedin,
    Instagram,
} from "lucide-react";
import { useAboutUs } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";


interface AboutPageEditorProps {
    tenantId: string;
}

export default function AboutPageEditor({ tenantId }: AboutPageEditorProps) {
    // About Us Hook
    const {
        aboutContent,
        loading: aboutLoading,
        saving: aboutSaving,
        saveAboutContent,
        uploadAboutImage,
    } = useAboutUs(tenantId);



    const { toast } = useToast();

    // Founder Form State
    const [founderFormData, setFounderFormData] = useState({
        mainHeading: "",
        companyStory: "",
        vision: "",
        mission: "",
        founderName: "",
        founderRole: "",
        founderDescription: "",
        founderLinkedinUrl: "",
        founderInstagramUrl: "",
        yearsExperience: 0,
        projectsCompleted: 0,
    });



    const [uploadingFounderImage, setUploadingFounderImage] = useState(false);
    const founderImageInputRef = useRef<HTMLInputElement>(null);

    // Sync Founder Data
    useEffect(() => {
        if (aboutContent) {
            setFounderFormData({
                mainHeading: aboutContent.mainHeading || "",
                companyStory: aboutContent.companyStory || "",
                vision: aboutContent.vision || "",
                mission: aboutContent.mission || "",
                founderName: aboutContent.founderName || "",
                founderRole: aboutContent.founderRole || "",
                founderDescription: aboutContent.founderDescription || "",
                founderLinkedinUrl: aboutContent.founderLinkedinUrl || "",
                founderInstagramUrl: aboutContent.founderInstagramUrl || "",
                yearsExperience: aboutContent.yearsExperience || 0,
                projectsCompleted: aboutContent.projectsCompleted || 0,
            });
        }
    }, [aboutContent]);

    // Handlers
    const handleFounderInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFounderFormData((prev) => ({
            ...prev,
            [name]:
                name === "yearsExperience" || name === "projectsCompleted"
                    ? parseInt(value) || 0
                    : value,
        }));
    };

    const handleUploadFounderImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFounderImage(true);
        const url = await uploadAboutImage(file);
        setUploadingFounderImage(false);

        if (url) {
            await saveAboutContent({ founderImageUrl: url });
            toast({
                title: "Uploaded",
                description: "Founder image uploaded successfully.",
            });
        }
    };

    const handleSaveFounder = async () => {
        const success = await saveAboutContent(founderFormData);
        if (success) {
            toast({
                title: "Saved",
                description: "About Us page updated successfully.",
            });
        } else {
            toast({
                title: "Error",
                description: "Failed to save changes.",
                variant: "destructive",
            });
        }
    };



    if (aboutLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Company Info */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Main Heading</Label>
                        <Input
                            name="mainHeading"
                            value={founderFormData.mainHeading}
                            onChange={handleFounderInputChange}
                            placeholder="About Our Company"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Company Story</Label>
                        <Textarea
                            name="companyStory"
                            value={founderFormData.companyStory}
                            onChange={handleFounderInputChange}
                            placeholder="Tell your company's story..."
                            rows={6}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vision</Label>
                            <Textarea
                                name="vision"
                                value={founderFormData.vision}
                                onChange={handleFounderInputChange}
                                placeholder="Our vision for the future..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mission</Label>
                            <Textarea
                                name="mission"
                                value={founderFormData.mission}
                                onChange={handleFounderInputChange}
                                placeholder="Our mission statement..."
                                rows={3}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Founder Info */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Founder Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Founder Image */}
                        <div className="space-y-4">
                            <Label>Founder Photo</Label>
                            <div
                                className="relative w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden bg-gray-50 flex items-center justify-center group"
                                onClick={() => founderImageInputRef.current?.click()}
                            >
                                {uploadingFounderImage ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                ) : aboutContent?.founderImageUrl ? (
                                    <>
                                        <img
                                            src={aboutContent.founderImageUrl}
                                            alt="Founder"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-8 w-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Upload Photo</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={founderImageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleUploadFounderImage}
                                className="hidden"
                            />
                        </div>

                        {/* Founder Details */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        name="founderName"
                                        value={founderFormData.founderName}
                                        onChange={handleFounderInputChange}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role / Designation</Label>
                                    <Input
                                        name="founderRole"
                                        value={founderFormData.founderRole}
                                        onChange={handleFounderInputChange}
                                        placeholder="Principal Architect"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Short Bio / Description</Label>
                                <Textarea
                                    name="founderDescription"
                                    value={founderFormData.founderDescription}
                                    onChange={handleFounderInputChange}
                                    placeholder="With over 15 years of experience..."
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>LinkedIn URL</Label>
                                    <div className="relative">
                                        <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            name="founderLinkedinUrl"
                                            value={founderFormData.founderLinkedinUrl}
                                            onChange={handleFounderInputChange}
                                            className="pl-9"
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Instagram URL</Label>
                                    <div className="relative">
                                        <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            name="founderInstagramUrl"
                                            value={founderFormData.founderInstagramUrl}
                                            onChange={handleFounderInputChange}
                                            className="pl-9"
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Years of Experience</Label>
                            <Input
                                type="number"
                                name="yearsExperience"
                                value={founderFormData.yearsExperience}
                                onChange={handleFounderInputChange}
                                placeholder="10"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Projects Completed</Label>
                            <Input
                                type="number"
                                name="projectsCompleted"
                                value={founderFormData.projectsCompleted}
                                onChange={handleFounderInputChange}
                                placeholder="500"
                                min="0"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-6 z-10">
                <Button
                    onClick={handleSaveFounder}
                    disabled={aboutSaving}
                    size="lg"
                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 rounded-xl shadow-lg h-12"
                >
                    {aboutSaving ? (
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
