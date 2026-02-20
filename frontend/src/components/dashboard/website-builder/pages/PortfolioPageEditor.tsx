"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2, Save, Plus, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { usePortfolio } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioProject } from "@/types/website";

interface PortfolioPageEditorProps {
    tenantId: string;
}

export default function PortfolioPageEditor({ tenantId }: PortfolioPageEditorProps) {
    const { projects, loading, saving, addProject, updateProject, deleteProject, uploadProjectImage } = usePortfolio(tenantId);
    const { toast } = useToast();

    const [editingProject, setEditingProject] = useState<Partial<PortfolioProject> | null>(null);
    // REMOVED: const [imageType, setImageType] = useState<"single" | "before_after">("single");
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);

    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const handleAddProject = () => {
        setEditingProject({
            title: "",
            category: "residential",
            description: "",
            beforeImageUrl: "",
            afterImageUrl: "",
            location: "",
            imageStyle: "single", // Default to single for new projects
        });
    };

    const handleEditClick = (project: PortfolioProject) => {
        // Handle legacy data: if no imageStyle, default to single
        const style = project.imageStyle || "single";
        setEditingProject({ ...project, imageStyle: style });
    };

    const handleSaveProject = async () => {
        if (!editingProject) return;

        // Ensure style is set
        const projectToSave = {
            ...editingProject,
            imageStyle: editingProject.imageStyle || "single"
        };

        if (editingProject.id) {
            const success = await updateProject(editingProject.id, projectToSave);
            if (success) {
                toast({ title: "Saved", description: "Project updated successfully." });
                setEditingProject(null);
            }
        } else {
            const success = await addProject(projectToSave as any);
            if (success) {
                toast({ title: "Added", description: "Project added successfully." });
                setEditingProject(null);
            }
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
        const file = e.target.files?.[0];
        if (!file || !editingProject) return;

        if (type === "before") setUploadingBefore(true);
        else setUploadingAfter(true);

        const url = await uploadProjectImage(file);

        if (type === "before") setUploadingBefore(false);
        else setUploadingAfter(false);

        if (url) {
            setEditingProject({
                ...editingProject,
                [type === "before" ? "beforeImageUrl" : "afterImageUrl"]: url,
            });
            toast({ title: "Uploaded", description: "Image uploaded successfully." });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Portfolio Projects</CardTitle>
                        <Button onClick={handleAddProject} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] rounded-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Project
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(projects?.length || 0) === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No projects yet. Add your first portfolio project.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(projects || []).map((project) => (
                                <div key={project.id} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all">
                                    <div className="grid grid-cols-2 gap-1">
                                        {project.beforeImageUrl && (
                                            <img src={project.beforeImageUrl} alt="Before" className="w-full h-32 object-cover" />
                                        )}
                                        {project.afterImageUrl && (
                                            <img src={project.afterImageUrl} alt="After" className="w-full h-32 object-cover" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold">{project.title}</h4>
                                                <p className="text-xs text-gray-500">{project.category} • {project.location}</p>
                                                <p className="text-xs text-blue-600 mt-1">{project.imageStyle === "single" ? "Single Image" : "Comparison"}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" onClick={() => handleEditClick(project)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => deleteProject(project.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Edit Project Dialog */}
                    {editingProject && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                                <h3 className="text-xl font-bold mb-4">{editingProject.id ? "Edit Project" : "Add Project"}</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={editingProject.title || ""}
                                                onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                                                placeholder="Modern Kitchen Renovation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select
                                                value={editingProject.category || "residential"}
                                                onValueChange={(value: "residential" | "commercial") =>
                                                    setEditingProject({ ...editingProject, category: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="residential">Residential</SelectItem>
                                                    <SelectItem value="commercial">Commercial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input
                                            value={editingProject.location || ""}
                                            onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                                            placeholder="Mumbai, India"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={editingProject.description || ""}
                                            onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                                            placeholder="Describe the project..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Show on Homepage</Label>
                                            <p className="text-sm text-gray-500">Display this project in the homepage portfolio section</p>
                                        </div>
                                        <Switch
                                            checked={editingProject.showOnHomepage || false}
                                            onCheckedChange={(checked) => setEditingProject({ ...editingProject, showOnHomepage: checked })}
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Label>Image Style</Label>
                                        <div className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="type-single"
                                                    name="image-type"
                                                    checked={editingProject.imageStyle === "single"}
                                                    onChange={() => setEditingProject({ ...editingProject, imageStyle: "single" })}
                                                    className="h-4 w-4 text-slate-900 border-gray-300 focus:ring-slate-900"
                                                />
                                                <Label htmlFor="type-single">Single Image</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="type-comparison"
                                                    name="image-type"
                                                    checked={editingProject.imageStyle === "before_after"}
                                                    onChange={() => setEditingProject({ ...editingProject, imageStyle: "before_after" })}
                                                    className="h-4 w-4 text-slate-900 border-gray-300 focus:ring-slate-900"
                                                />
                                                <Label htmlFor="type-comparison">Before / After Comparison</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {editingProject.imageStyle === "single" ? (
                                        <div className="space-y-2">
                                            <Label>Project Image</Label>
                                            <div
                                                className="relative w-full h-64 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden"
                                                onClick={() => afterInputRef.current?.click()}
                                            >
                                                {uploadingAfter ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                    </div>
                                                ) : editingProject.afterImageUrl ? (
                                                    <img src={editingProject.afterImageUrl} alt="Project" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-500">Upload Image</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={afterInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleUploadImage(e, "after")}
                                                className="hidden"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Before Image</Label>
                                                <div
                                                    className="relative w-full h-40 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden"
                                                    onClick={() => beforeInputRef.current?.click()}
                                                >
                                                    {uploadingBefore ? (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                        </div>
                                                    ) : editingProject.beforeImageUrl ? (
                                                        <img src={editingProject.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full">
                                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                            <p className="text-sm text-gray-500">Upload Before</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    ref={beforeInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleUploadImage(e, "before")}
                                                    className="hidden"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>After Image</Label>
                                                <div
                                                    className="relative w-full h-40 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden"
                                                    onClick={() => afterInputRef.current?.click()}
                                                >
                                                    {uploadingAfter ? (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                        </div>
                                                    ) : editingProject.afterImageUrl ? (
                                                        <img src={editingProject.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full">
                                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                            <p className="text-sm text-gray-500">Upload After</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    ref={afterInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleUploadImage(e, "after")}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={handleSaveProject} className="flex-1" disabled={saving}>
                                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                            Save Project
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditingProject(null)} className="flex-1">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}

