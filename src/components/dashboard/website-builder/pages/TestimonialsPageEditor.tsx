"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Save, Plus, Trash2, Edit, Star, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTestimonials } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";
import type { Testimonial } from "@/types/website";

interface TestimonialsPageEditorProps {
    tenantId: string;
}

export default function TestimonialsPageEditor({ tenantId }: TestimonialsPageEditorProps) {
    const { testimonials, loading, saving, addTestimonial, updateTestimonial, deleteTestimonial, uploadTestimonialImage } = useTestimonials(tenantId);
    const { toast } = useToast();

    const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const handleAddTestimonial = () => {
        setEditingTestimonial({
            clientName: "",
            location: "",
            reviewText: "",
            rating: 5,
            clientImageUrl: "",
        });
    };

    const handleSaveTestimonial = async () => {
        if (!editingTestimonial) return;

        if (editingTestimonial.id) {
            const success = await updateTestimonial(editingTestimonial.id, editingTestimonial);
            if (success) {
                toast({ title: "Saved", description: "Testimonial updated successfully." });
                setEditingTestimonial(null);
            }
        } else {
            const success = await addTestimonial(editingTestimonial as any);
            if (success) {
                toast({ title: "Added", description: "Testimonial added successfully." });
                setEditingTestimonial(null);
            }
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingTestimonial) return;

        setUploadingImage(true);
        const url = await uploadTestimonialImage(file);
        setUploadingImage(false);

        if (url) {
            setEditingTestimonial({ ...editingTestimonial, clientImageUrl: url });
            toast({ title: "Uploaded", description: "Image uploaded successfully." });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Client Testimonials</CardTitle>
                        <Button onClick={handleAddTestimonial} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] rounded-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Testimonial
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(testimonials?.length || 0) === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No testimonials yet. Add your first client review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(testimonials || []).map((testimonial) => (
                                <div key={testimonial.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                                    <div className="flex items-start gap-3 mb-3">
                                        {testimonial.clientImageUrl ? (
                                            <img src={testimonial.clientImageUrl} alt={testimonial.clientName} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-500 font-semibold">{testimonial.clientName.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{testimonial.clientName}</h4>
                                            <p className="text-xs text-gray-500">{testimonial.location}</p>
                                            <div className="flex gap-0.5 mt-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`h-3 w-3 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="outline" onClick={() => setEditingTestimonial(testimonial)}>
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => deleteTestimonial(testimonial.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3">{testimonial.reviewText}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Edit Testimonial Dialog */}
                    {editingTestimonial && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                                <h3 className="text-xl font-bold mb-4">{editingTestimonial.id ? "Edit Testimonial" : "Add Testimonial"}</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Client Name</Label>
                                            <Input
                                                value={editingTestimonial.clientName || ""}
                                                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                value={editingTestimonial.location || ""}
                                                onChange={(e) => setEditingTestimonial({ ...editingTestimonial, location: e.target.value })}
                                                placeholder="Mumbai, India"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Review</Label>
                                        <Textarea
                                            value={editingTestimonial.reviewText || ""}
                                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, reviewText: e.target.value })}
                                            placeholder="Write the client's review..."
                                            rows={4}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Rating</Label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                <button
                                                    key={rating}
                                                    type="button"
                                                    onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: rating as any })}
                                                    className="focus:outline-none"
                                                >
                                                    <Star
                                                        className={`h-8 w-8 ${rating <= (editingTestimonial.rating || 0)
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-gray-300"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Client Photo (Optional)</Label>
                                        <div
                                            className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden"
                                            onClick={() => imageInputRef.current?.click()}
                                        >
                                            {uploadingImage ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                </div>
                                            ) : editingTestimonial.clientImageUrl ? (
                                                <img src={editingTestimonial.clientImageUrl} alt="Client" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                    <p className="text-xs text-gray-500">Upload Photo</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                            className="hidden"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Show on Homepage</Label>
                                            <p className="text-sm text-gray-500">Display this testimonial on the homepage</p>
                                        </div>
                                        <Switch
                                            checked={editingTestimonial.showOnHomepage || false}
                                            onCheckedChange={(checked) => setEditingTestimonial({ ...editingTestimonial, showOnHomepage: checked })}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={handleSaveTestimonial} className="flex-1" disabled={saving}>
                                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                            Save Testimonial
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditingTestimonial(null)} className="flex-1">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
