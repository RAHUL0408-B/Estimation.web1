"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Upload,
    Loader2,
    Save,
    Plus,
    Trash2,
    Edit,
    GripVertical,
    Image as ImageIcon,
} from "lucide-react";
import { useHomePage } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";
import type { HeroSlide } from "@/types/website";

interface HomePageEditorProps {
    tenantId: string;
}

export default function HomePageEditor({ tenantId }: HomePageEditorProps) {
    const {
        homeContent,
        loading,
        saving,
        saveHomeContent,
        uploadHomeImage,
        addHeroSlide,
        updateHeroSlide,
        deleteHeroSlide,
    } = useHomePage(tenantId);
    const { toast } = useToast();

    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!homeContent) return null;

    // Hero Slider Section
    const handleAddSlide = () => {
        setEditingSlide({
            id: "",
            imageUrl: "",
            heading: "",
            subheading: "",
            primaryButtonText: "Get Estimate",
            primaryButtonLink: `/${tenantId}/estimate`,
            secondaryButtonText: "Book Consultation",
            secondaryButtonLink: `/${tenantId}/book-consultation`,
            order: 0,
        });
    };

    const handleSaveSlide = async () => {
        if (!editingSlide) return;

        if (editingSlide.id) {
            const success = await updateHeroSlide(editingSlide.id, editingSlide);
            if (success) {
                toast({ title: "Saved", description: "Slide updated successfully." });
                setEditingSlide(null);
            }
        } else {
            const success = await addHeroSlide(editingSlide);
            if (success) {
                toast({ title: "Added", description: "Slide added successfully." });
                setEditingSlide(null);
            }
        }
    };

    const handleUploadSlideImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingSlide) return;

        setUploadingImage(true);
        const url = await uploadHomeImage(file, "hero");
        setUploadingImage(false);

        if (url) {
            setEditingSlide({ ...editingSlide, imageUrl: url });
            toast({ title: "Uploaded", description: "Image uploaded successfully." });
        }
    };

    // About Preview Section
    const handleSaveAboutPreview = async () => {
        const success = await saveHomeContent({
            aboutPreview: homeContent.aboutPreview,
        });
        if (success) {
            toast({ title: "Saved", description: "About preview updated." });
        }
    };

    // CTA Section
    const handleSaveCTA = async () => {
        const success = await saveHomeContent({
            cta: homeContent.cta,
        });
        if (success) {
            toast({ title: "Saved", description: "CTA section updated." });
        }
    };

    return (
        <div className="space-y-8">
            {/* Hero Slider Section */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Hero Slider</CardTitle>
                        <Button
                            onClick={handleAddSlide}
                            size="sm"
                            className="bg-[#0F172A] hover:bg-[#1E293B] rounded-lg"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Slide
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(homeContent.heroSlides?.length || 0) === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No slides yet. Add your first hero slide.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(homeContent.heroSlides || []).map((slide) => (
                                <div
                                    key={slide.id}
                                    className="relative group rounded-lg border-2 border-gray-200 overflow-hidden hover:border-gray-300 transition-all"
                                >
                                    {slide.imageUrl ? (
                                        <img
                                            src={slide.imageUrl}
                                            alt={slide.heading}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setEditingSlide(slide)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => deleteHeroSlide(slide.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="p-3 bg-white">
                                        <h4 className="font-semibold text-sm truncate">{slide.heading}</h4>
                                        <p className="text-xs text-gray-500 truncate">{slide.subheading}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Edit Slide Dialog */}
                    {editingSlide && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                                <h3 className="text-xl font-bold mb-4">
                                    {editingSlide.id ? "Edit Slide" : "Add Slide"}
                                </h3>
                                <div className="space-y-4">
                                    {/* Image Upload */}
                                    <div className="space-y-2">
                                        <Label>Background Image (1920x1080)</Label>
                                        <div
                                            className="relative w-full h-48 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {uploadingImage ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                </div>
                                            ) : editingSlide.imageUrl ? (
                                                <img
                                                    src={editingSlide.imageUrl}
                                                    alt="Slide"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500">Upload Image</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUploadSlideImage}
                                            className="hidden"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Heading</Label>
                                        <Input
                                            value={editingSlide.heading}
                                            onChange={(e) =>
                                                setEditingSlide({ ...editingSlide, heading: e.target.value })
                                            }
                                            placeholder="Design your dream home"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Subheading</Label>
                                        <Textarea
                                            value={editingSlide.subheading}
                                            onChange={(e) =>
                                                setEditingSlide({ ...editingSlide, subheading: e.target.value })
                                            }
                                            placeholder="From modular kitchens to complete renovations..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Primary Button Text</Label>
                                            <Input
                                                value={editingSlide.primaryButtonText || ""}
                                                onChange={(e) =>
                                                    setEditingSlide({ ...editingSlide, primaryButtonText: e.target.value })
                                                }
                                                placeholder="Get Estimate"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Primary Button Link</Label>
                                            <Input
                                                value={editingSlide.primaryButtonLink || ""}
                                                onChange={(e) =>
                                                    setEditingSlide({ ...editingSlide, primaryButtonLink: e.target.value })
                                                }
                                                placeholder="/estimate"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Secondary Button Text</Label>
                                            <Input
                                                value={editingSlide.secondaryButtonText || ""}
                                                onChange={(e) =>
                                                    setEditingSlide({ ...editingSlide, secondaryButtonText: e.target.value })
                                                }
                                                placeholder="Book Consultation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Secondary Button Link</Label>
                                            <Input
                                                value={editingSlide.secondaryButtonLink || ""}
                                                onChange={(e) =>
                                                    setEditingSlide({ ...editingSlide, secondaryButtonLink: e.target.value })
                                                }
                                                placeholder="/book-consultation"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={handleSaveSlide} className="flex-1">
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Slide
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setEditingSlide(null)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* About Preview Section */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">About Preview Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Section Title</Label>
                        <Input
                            value={homeContent.aboutPreview?.title || ""}
                            onChange={(e) =>
                                saveHomeContent({
                                    aboutPreview: {
                                        ...homeContent.aboutPreview,
                                        title: e.target.value,
                                    },
                                })
                            }
                            placeholder="About Our Company"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={homeContent.aboutPreview?.description || ""}
                            onChange={(e) =>
                                saveHomeContent({
                                    aboutPreview: {
                                        ...homeContent.aboutPreview,
                                        description: e.target.value,
                                    },
                                })
                            }
                            placeholder="Tell visitors about your company..."
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>


        </div>
    );
}
