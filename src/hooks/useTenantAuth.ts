"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getTenantByEmail, Tenant } from "@/lib/firestoreHelpers";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Cache tenant data to prevent re-fetching on every render
const tenantCache: { [email: string]: { data: Tenant; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useTenantAuth() {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const isFetchingRef = useRef(false);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                const email = firebaseUser.email || "";

                // Check cache first
                const cached = tenantCache[email];
                if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                    setTenant(cached.data);
                    setLoading(false);
                    return;
                }

                // Prevent concurrent fetches
                if (isFetchingRef.current) {
                    return;
                }

                isFetchingRef.current = true;

                try {
                    // Get tenant data from Firestore
                    const tenantData = await getTenantByEmail(email);
                    if (tenantData) {
                        // Cache the result
                        tenantCache[email] = { data: tenantData, timestamp: Date.now() };
                        setTenant(tenantData);
                    } else if (!tenant) {
                        // Only clear tenant if we don't have one cached
                        setTenant(null);
                    }
                } catch (error) {
                    console.error("Error fetching tenant data:", error);
                    // Don't clear tenant on error - keep existing data
                } finally {
                    isFetchingRef.current = false;
                }
            } else {
                setUser(null);
                setTenant(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setError("");
        setLoading(true);

        try {
            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Get tenant data
            const tenantData = await getTenantByEmail(email);

            if (!tenantData) {
                setError("No designer account found with this email");
                await signOut(auth);
                setLoading(false);
                return false;
            }

            // Check if tenant is approved
            if (tenantData.status !== "active") {
                let message = "";
                switch (tenantData.status) {
                    case "pending":
                        message = "Your account is pending approval from the super admin";
                        break;
                    case "rejected":
                        message = "Your account has been rejected";
                        break;
                    case "inactive":
                        message = "Your account has been deactivated";
                        break;
                    default:
                        message = "Your account is not active";
                }
                setError(message);
                await signOut(auth);
                setLoading(false);
                return false;
            }

            setTenant(tenantData);
            setUser(userCredential.user);

            // Cache the tenant data
            tenantCache[email] = { data: tenantData, timestamp: Date.now() };

            // Sync to 'users' collection (New requirement)
            try {
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    email: email,
                    role: "admin",
                    tenantId: userCredential.user.uid, // Admins are their own tenants
                    lastLogin: serverTimestamp()
                }, { merge: true });
            } catch (e) {
                console.error("Failed to sync admin user:", e);
            }

            setLoading(false);
            return true;
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Invalid email or password");
            setLoading(false);
            return false;
        }
    };

    const logout = async () => {
        try {
            // Clear tenant cache
            if (user?.email) {
                delete tenantCache[user.email];
            }
            await signOut(auth);
            setTenant(null);
            setUser(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return {
        tenant,
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user && !!tenant && tenant.status === "active",
    };
}
