"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Palette } from "lucide-react";
import { useTheme } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";

interface ThemeTabProps {
    tenantId: string;
}

export default function ThemeTab({ tenantId }: ThemeTabProps) {
    const { theme, loading, saving, saveTheme } = useTheme(tenantId);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        primaryColor: "#ea580c",
        secondaryColor: "#1c1917",
        accentColor: "#f59e0b",
        fontStyle: "modern" as "modern" | "elegant" | "minimal",
        buttonRadius: 8,
        cardShadow: true,
        backgroundColor: "#ffffff",
    });

    useEffect(() => {
        if (theme) {
            setFormData({
                primaryColor: theme.primaryColor || "#ea580c",
                secondaryColor: theme.secondaryColor || "#1c1917",
                accentColor: theme.accentColor || "#f59e0b",
                fontStyle: theme.fontStyle || "modern",
                buttonRadius: theme.buttonRadius || 8,
                cardShadow: theme.cardShadow ?? true,
                backgroundColor: theme.backgroundColor || "#ffffff",
            });
        }
    }, [theme]);

    const handleColorChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        const success = await saveTheme(formData);
        if (success) {
            toast({ title: "Saved", description: "Theme settings have been updated." });
        } else {
            toast({
                title: "Error",
                description: "Failed to save theme settings.",
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
            {/* Color Scheme */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-xl">Color Scheme</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Primary Color */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Primary Color</Label>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={formData.primaryColor}
                                        onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                                        className="h-12 w-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                                    />
                                </div>
                                <Input
                                    value={formData.primaryColor}
                                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                                    className="font-mono uppercase h-12 rounded-lg"
                                    placeholder="#ea580c"
                                />
                            </div>
                            <div
                                className="h-16 rounded-lg border-2 border-gray-200"
                                style={{ backgroundColor: formData.primaryColor }}
                            />
                            <p className="text-xs text-gray-500">Used for buttons, links, and accents</p>
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Secondary Color</Label>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={formData.secondaryColor}
                                        onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                                        className="h-12 w-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                                    />
                                </div>
                                <Input
                                    value={formData.secondaryColor}
                                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                                    className="font-mono uppercase h-12 rounded-lg"
                                    placeholder="#1c1917"
                                />
                            </div>
                            <div
                                className="h-16 rounded-lg border-2 border-gray-200"
                                style={{ backgroundColor: formData.secondaryColor }}
                            />
                            <p className="text-xs text-gray-500">Used for headers and footers</p>
                        </div>

                        {/* Accent Color */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Accent Color</Label>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={formData.accentColor}
                                        onChange={(e) => handleColorChange("accentColor", e.target.value)}
                                        className="h-12 w-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                                    />
                                </div>
                                <Input
                                    value={formData.accentColor}
                                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                                    className="font-mono uppercase h-12 rounded-lg"
                                    placeholder="#f59e0b"
                                />
                            </div>
                            <div
                                className="h-16 rounded-lg border-2 border-gray-200"
                                style={{ backgroundColor: formData.accentColor }}
                            />
                            <p className="text-xs text-gray-500">Used for highlights and badges</p>
                        </div>

                        {/* Background Color */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Background Color</Label>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={formData.backgroundColor}
                                        onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                                        className="h-12 w-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                                    />
                                </div>
                                <Input
                                    value={formData.backgroundColor}
                                    onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                                    className="font-mono uppercase h-12 rounded-lg"
                                    placeholder="#ffffff"
                                />
                            </div>
                            <div
                                className="h-16 rounded-lg border-2 border-gray-200"
                                style={{ backgroundColor: formData.backgroundColor }}
                            />
                            <p className="text-xs text-gray-500">The main background color of your website</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Typography & Style */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Typography & Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Font Style */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Font Style</Label>
                            <Select
                                value={formData.fontStyle}
                                onValueChange={(value: "modern" | "elegant" | "minimal") =>
                                    setFormData((prev) => ({ ...prev, fontStyle: value }))
                                }
                            >
                                <SelectTrigger className="h-12 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="modern">Modern (Inter, Roboto)</SelectItem>
                                    <SelectItem value="elegant">Elegant (Playfair, Cormorant)</SelectItem>
                                    <SelectItem value="minimal">Minimal (Helvetica, Arial)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Choose the typography style for your website
                            </p>
                        </div>

                        {/* Button Radius */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Button Radius: {formData.buttonRadius}px
                            </Label>
                            <input
                                type="range"
                                min="0"
                                max="24"
                                step="2"
                                value={formData.buttonRadius}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        buttonRadius: parseInt(e.target.value),
                                    }))
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
                            />
                            <div className="flex gap-3 items-center">
                                <Button
                                    style={{ borderRadius: `${formData.buttonRadius}px` }}
                                    className="bg-[#0F172A] hover:bg-[#1E293B]"
                                >
                                    Preview Button
                                </Button>
                                <p className="text-xs text-gray-500">Adjust button corner roundness</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Shadow */}
                    <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Card Shadow</Label>
                            <p className="text-xs text-gray-500">
                                Enable subtle shadows on cards and components
                            </p>
                        </div>
                        <Switch
                            checked={formData.cardShadow}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, cardShadow: checked }))
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Preview */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 p-6 rounded-2xl border border-gray-100" style={{ backgroundColor: formData.backgroundColor }}>
                        <div
                            className="p-8 rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: formData.secondaryColor }}
                        >
                            <h3 className="text-2xl font-bold mb-2">Sample Heading</h3>
                            <p className="text-gray-300 mb-4">
                                This is how your website will look with the selected theme.
                            </p>
                            <Button
                                style={{
                                    backgroundColor: formData.primaryColor,
                                    borderRadius: `${formData.buttonRadius}px`,
                                }}
                                className="text-white"
                            >
                                Primary Button
                            </Button>
                        </div>

                        <div
                            className={`p-6 rounded-xl border-2 border-gray-200 ${formData.cardShadow ? "shadow-lg" : ""
                                }`}
                        >
                            <h4 className="font-semibold mb-2">Sample Card</h4>
                            <p className="text-sm text-gray-600">
                                Cards will {formData.cardShadow ? "have" : "not have"} shadows based on
                                your selection.
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
