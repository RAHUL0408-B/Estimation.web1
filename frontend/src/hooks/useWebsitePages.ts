"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
} from "@/lib/firebaseWrapper";
import { ref, uploadBytes, getDownloadURL } from "@/lib/firebaseWrapper";

export interface PageSection {
    id: string;
    type: "text" | "image" | "gallery" | "cta";
    content: string;
    imageUrl?: string;
    imageUrls?: string[];
    buttonText?: string;
    buttonLink?: string;
    order: number;
}

export interface WebsitePage {
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
    order: number;
    sections: PageSection[];
    createdAt?: any;
    updatedAt?: any;
}

export function useWebsitePages(tenantId: string | null) {
    const [pages, setPages] = useState<WebsitePage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Real-time listener for pages
    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const pagesRef = collection(db, "tenants", tenantId, "pages");
        const q = query(pagesRef, orderBy("order", "asc"));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const pagesData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as WebsitePage[];
                setPages(pagesData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching pages:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [tenantId]);

    // Create a new page
    const createPage = async (title: string, slug: string): Promise<string | null> => {
        if (!tenantId) return null;

        setSaving(true);
        try {
            const pagesRef = collection(db, "tenants", tenantId, "pages");
            const newPage = {
                title,
                slug: slug.toLowerCase().replace(/\s+/g, "-"),
                isPublished: false,
                order: pages.length,
                sections: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            const docRef = await addDoc(pagesRef, newPage);
            return docRef.id;
        } catch (error) {
            console.error("Error creating page:", error);
            return null;
        } finally {
            setSaving(false);
        }
    };

    // Update a page
    const updatePage = async (pageId: string, updates: Partial<WebsitePage>): Promise<boolean> => {
        if (!tenantId) return false;

        setSaving(true);
        try {
            const pageRef = doc(db, "tenants", tenantId, "pages", pageId);
            await updateDoc(pageRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
            return true;
        } catch (error) {
            console.error("Error updating page:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Delete a page
    const deletePage = async (pageId: string): Promise<boolean> => {
        if (!tenantId) return false;

        setSaving(true);
        try {
            const pageRef = doc(db, "tenants", tenantId, "pages", pageId);
            await deleteDoc(pageRef);
            return true;
        } catch (error) {
            console.error("Error deleting page:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Toggle page publish status
    const togglePublish = async (pageId: string, isPublished: boolean): Promise<boolean> => {
        return updatePage(pageId, { isPublished });
    };

    // Add section to page
    const addSection = async (
        pageId: string,
        type: PageSection["type"],
        content: string = ""
    ): Promise<boolean> => {
        const page = pages.find((p) => p.id === pageId);
        if (!page) return false;

        const newSection: PageSection = {
            id: `section_${Date.now()}`,
            type,
            content,
            order: page.sections.length,
        };

        return updatePage(pageId, {
            sections: [...page.sections, newSection],
        });
    };

    // Update section
    const updateSection = async (
        pageId: string,
        sectionId: string,
        updates: Partial<PageSection>
    ): Promise<boolean> => {
        const page = pages.find((p) => p.id === pageId);
        if (!page) return false;

        const updatedSections = page.sections.map((s) =>
            s.id === sectionId ? { ...s, ...updates } : s
        );

        return updatePage(pageId, { sections: updatedSections });
    };

    // Delete section
    const deleteSection = async (pageId: string, sectionId: string): Promise<boolean> => {
        const page = pages.find((p) => p.id === pageId);
        if (!page) return false;

        const updatedSections = page.sections.filter((s) => s.id !== sectionId);
        return updatePage(pageId, { sections: updatedSections });
    };

    // Reorder pages
    const reorderPages = async (reorderedPages: WebsitePage[]): Promise<boolean> => {
        if (!tenantId) return false;

        setSaving(true);
        try {
            await Promise.all(
                reorderedPages.map((page, index) =>
                    updateDoc(doc(db, "tenants", tenantId, "pages", page.id), { order: index })
                )
            );
            return true;
        } catch (error) {
            console.error("Error reordering pages:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Upload image for section
    const uploadSectionImage = async (file: File, pageId: string): Promise<string | null> => {
        if (!tenantId) return null;

        try {
            const path = `tenants/${tenantId}/pages/${pageId}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Error uploading section image:", error);
            return null;
        }
    };

    // Get published pages only (for public website)
    const publishedPages = pages.filter((p) => p.isPublished);

    return {
        pages,
        publishedPages,
        loading,
        saving,
        createPage,
        updatePage,
        deletePage,
        togglePublish,
        addSection,
        updateSection,
        deleteSection,
        reorderPages,
        uploadSectionImage,
    };
}
