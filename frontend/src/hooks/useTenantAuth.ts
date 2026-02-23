"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/supabaseClient";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "@/lib/supabaseWrapper";
import { getTenantByEmail, Tenant } from "@/lib/firestoreHelpers";
import { doc, setDoc, serverTimestamp, updateDoc } from "@/lib/supabaseWrapper";

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

        const unsubscribe = onAuthStateChanged(auth, async (supabaseUser) => {
            if (supabaseUser) {
                setUser(supabaseUser);

                const email = supabaseUser.email || "";

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
                    let tenantData = await getTenantByEmail(email);

                    // Auto-provision if missing (e.g. from Google OAuth)
                    if (!tenantData && supabaseUser) {
                        try {
                            const { collection, addDoc, serverTimestamp, setDoc, doc } = await import('@/lib/supabaseWrapper');
                            const name = supabaseUser.user_metadata?.full_name || email.split('@')[0] || "User";

                            // Create their tenant
                            const tenantRef = await addDoc(collection(db, "tenants"), {
                                ownerUid: supabaseUser.uid,
                                ownerName: name,
                                businessName: `${name}'s Workspace`,
                                email: email,
                                mobile: "",
                                subscription: { plan: 'free', status: 'active', startDate: new Date().toISOString() },
                                status: "active",
                                revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
                                settings: { autoApproval: false, notifications: true },
                                createdAt: serverTimestamp(),
                                lastLogin: serverTimestamp()
                            });

                            // Create their user record mapping to the tenant
                            await setDoc(doc(db, "users", supabaseUser.uid), {
                                uid: supabaseUser.uid,
                                email: email,
                                role: "admin",
                                tenantId: tenantRef.id,
                                name: name,
                                mobile: "",
                                createdAt: serverTimestamp(),
                                lastLogin: serverTimestamp()
                            });

                            // Set the newly minted tenantData
                            tenantData = await getTenantByEmail(email);
                        } catch (provisionError) {
                            console.error("Failed to auto-provision tenant from OAuth:", provisionError);
                        }
                    }

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
            // Sign in with Supabase Auth
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
                // Ensure the tenant document has the correct ownerUid if missing
                // This is crucial for Firestore security rules to allow writes to subcollections
                if (tenantData.id && !tenantData.ownerUid) {
                    await updateDoc(doc(db, "tenants", tenantData.id), {
                        ownerUid: userCredential.user.uid
                    });
                    tenantData.ownerUid = userCredential.user.uid;
                }

                await setDoc(doc(db, "users", userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    email: email,
                    role: "admin",
                    tenantId: tenantData.id, // Fixed: use the actual tenant ID, not UID
                    lastLogin: serverTimestamp()
                }, { merge: true });
            } catch (e) {
                console.error("Failed to sync admin user or update ownerUid:", e);
            }

            setLoading(false);
            return true;
        } catch (err: any) {
            console.error("Login error:", err);
            let message = "Invalid email or password";
            if (err.code === "auth/configuration-not-found") {
                message = "Supabase Auth not configured correctly.";
            } else if (err.code === "auth/unauthorized-domain") {
                message = "This domain is not authorized in Supabase Console.";
            } else if (err.message && err.message.includes("reading 'app'")) {
                message = "Supabase initialization failed. Check environment variables.";
            } else if (err.message) {
                message = `Error: ${err.message}`;
            }
            setError(message);
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
