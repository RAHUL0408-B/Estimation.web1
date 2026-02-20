"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export interface UserRoleData {
    uid: string;
    email: string;
    role: "admin" | "customer";
    tenantId: string;
    name?: string;
    phone?: string;
}

export function useUserRole() {
    const [user, setUser] = useState<User | null>(null);
    const [roleData, setRoleData] = useState<UserRoleData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                        setRoleData(userDoc.data() as UserRoleData);
                    } else {
                        // Handle legacy users or sync issues
                        console.warn("User document not found in 'users' collection");
                        setRoleData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setRoleData(null);
                }
            } else {
                setUser(null);
                setRoleData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, roleData, loading };
}
