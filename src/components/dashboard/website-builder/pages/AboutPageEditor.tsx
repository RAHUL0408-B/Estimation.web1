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
    Plus,
    Trash2,
    Edit,
    Linkedin,
    Instagram,
} from "lucide-react";
import { useAboutUs, useTeamMembers } from "@/hooks/useWebsiteBuilder";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@/types/website";

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

    // Team Members Hook
    const {
        teamMembers,
        loading: teamLoading,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        uploadTeamMemberImage,
    } = useTeamMembers(tenantId);

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

    // Team Member State
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [uploadingMemberImage, setUploadingMemberImage] = useState(false);
    const memberImageInputRef = useRef<HTMLInputElement>(null);

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

    // Team Member Handlers
    const handleAddMember = () => {
        setEditingMember({
            id: "",
            name: "",
            role: "",
            bio: "",
            imageUrl: "",
            linkedinUrl: "",
            instagramUrl: "",
            showOnHomepage: false,
            order: 0,
        });
        setIsTeamDialogOpen(true);
    };

    const handleEditMember = (member: TeamMember) => {
        setEditingMember(member);
        setIsTeamDialogOpen(true);
    };

    const handleSaveMember = async () => {
        if (!editingMember) return;

        let success = false;
        if (editingMember.id) {
            success = await updateTeamMember(editingMember.id, editingMember);
        } else {
            success = await addTeamMember(editingMember);
        }

        if (success) {
            toast({
                title: "Success",
                description: editingMember.id
                    ? "Team member updated."
                    : "Team member added.",
            });
            setIsTeamDialogOpen(false);
            setEditingMember(null);
        }
    };

    const handleUploadMemberImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingMember) return;

        setUploadingMemberImage(true);
        const url = await uploadTeamMemberImage(file);
        setUploadingMemberImage(false);

        if (url) {
            setEditingMember({ ...editingMember, imageUrl: url });
            toast({
                title: "Uploaded",
                description: "Member photo uploaded successfully.",
            });
        }
    };

    if (aboutLoading || teamLoading) {
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

            {/* Team Members */}
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Team Members</CardTitle>
                        <Button
                            onClick={handleAddMember}
                            size="sm"
                            className="bg-[#0F172A] hover:bg-[#1E293B] rounded-lg"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {teamMembers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <p>No team members added yet.</p>
                            <Button variant="link" onClick={handleAddMember}>
                                Add your first team member
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="aspect-[4/3] bg-gray-100 relative">
                                        {member.imageUrl ? (
                                            <img
                                                src={member.imageUrl}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                <div className="text-center">
                                                    <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-2" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-semibold text-lg">{member.name}</h4>
                                        <p className="text-sm text-primary font-medium mb-1">
                                            {member.role}
                                        </p>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                                            {member.bio}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditMember(member)}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteTeamMember(member.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

            {/* Team Member Dialog */}
            {isTeamDialogOpen && editingMember && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {editingMember.id ? "Edit Team Member" : "Add Team Member"}
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Member Image */}
                                <div className="space-y-2">
                                    <Label>Photo</Label>
                                    <div
                                        className="relative w-full aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 overflow-hidden"
                                        onClick={() => memberImageInputRef.current?.click()}
                                    >
                                        {uploadingMemberImage ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                            </div>
                                        ) : editingMember.imageUrl ? (
                                            <img
                                                src={editingMember.imageUrl}
                                                alt="Member"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-xs text-gray-500">
                                                    Upload
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={memberImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadMemberImage}
                                        className="hidden"
                                    />
                                </div>

                                {/* Member Details */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={editingMember.name}
                                            onChange={(e) =>
                                                setEditingMember({
                                                    ...editingMember,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Jane Smith"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Input
                                            value={editingMember.role}
                                            onChange={(e) =>
                                                setEditingMember({
                                                    ...editingMember,
                                                    role: e.target.value,
                                                })
                                            }
                                            placeholder="Senior Designer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Bio</Label>
                                        <Textarea
                                            value={editingMember.bio}
                                            onChange={(e) =>
                                                setEditingMember({
                                                    ...editingMember,
                                                    bio: e.target.value,
                                                })
                                            }
                                            placeholder="Specializes in modern minimalism..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>LinkedIn (Optional)</Label>
                                    <Input
                                        value={editingMember.linkedinUrl || ""}
                                        onChange={(e) =>
                                            setEditingMember({
                                                ...editingMember,
                                                linkedinUrl: e.target.value,
                                            })
                                        }
                                        placeholder="https://linkedin.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Instagram (Optional)</Label>
                                    <Input
                                        value={editingMember.instagramUrl || ""}
                                        onChange={(e) =>
                                            setEditingMember({
                                                ...editingMember,
                                                instagramUrl: e.target.value,
                                            })
                                        }
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showOnHome"
                                    checked={editingMember.showOnHomepage}
                                    onChange={(e) =>
                                        setEditingMember({
                                            ...editingMember,
                                            showOnHomepage: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <Label htmlFor="showOnHome">Show on Homepage</Label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={handleSaveMember}
                                    className="flex-1 bg-black text-white hover:bg-gray-800"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Member
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsTeamDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
