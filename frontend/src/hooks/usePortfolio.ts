import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "@/lib/firebaseWrapper";

export interface Project {
    id: string;
    title: string;
    description: string;
    images: string[]; // URLs
    completionDate: string;
    location: string;
    category: string;
    status: "active" | "hidden";
    tenantId: string;
    createdAt?: any;
}

export function usePortfolio(tenantId: string | null) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const projectsRef = collection(db, "portfolio");
        const q = query(projectsRef, where("tenantId", "==", tenantId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Project[];
            setProjects(projectsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenantId]);

    const updateProjectStatus = async (projectId: string, status: "active" | "hidden") => {
        try {
            const projectRef = doc(db, "portfolio", projectId);
            await updateDoc(projectRef, { status });
        } catch (error) {
            console.error("Error updating project status:", error);
            throw error;
        }
    };

    const addProject = async (projectData: Omit<Project, "id" | "tenantId" | "createdAt" | "status">) => {
        if (!tenantId) throw new Error("No tenant ID");

        const projectsRef = collection(db, "portfolio");
        const docRef = await addDoc(projectsRef, {
            ...projectData,
            tenantId,
            status: "active",
            createdAt: serverTimestamp()
        });
        return docRef.id;
    };

    const deleteProject = async (projectId: string) => {
        try {
            await deleteDoc(doc(db, "portfolio", projectId));
        } catch (error) {
            console.error("Error deleting project:", error);
            throw error;
        }
    };

    return { projects, loading, updateProjectStatus, addProject, deleteProject };
}
