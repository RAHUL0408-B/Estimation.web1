"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    User
} from "@/lib/firebaseWrapper";
import { doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebaseWrapper";

export interface Customer {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    phoneNumber?: string;
    city?: string;
    createdAt: any;
    lastLogin: any;
}

export function useCustomerAuth() {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!auth) {
            console.warn("Firebase Auth not initialized. Skipping auth state listener.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // IMPORTANT: First check if this user is an admin
                // If so, DO NOT create customer records or modify auth state
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData?.role === "admin") {
                            // User is an admin - set flag and skip customer record creation
                            setIsAdmin(true);
                            setCustomer(null);
                            setLoading(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Error checking user role:", error);
                }

                setIsAdmin(false);

                // Fetch customer data from Firestore
                const customerDoc = await getDoc(doc(db, "customers", user.uid));
                if (customerDoc.exists()) {
                    setCustomer({ uid: user.uid, ...customerDoc.data() } as Customer);
                } else {
                    // Only create customer profile if user is not an admin
                    // and they explicitly signed up/logged in as customer
                    // Don't auto-create on page load
                    setCustomer(null);
                }
            } else {
                setCustomer(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithEmail = async (email: string, password: string) => {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Check if customer record exists, create if not
        const customerDoc = await getDoc(doc(db, "customers", result.user.uid));
        if (customerDoc.exists()) {
            // Update last login in customers (legacy)
            await setDoc(doc(db, "customers", result.user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true });

            // Update customer state
            setCustomer({ uid: result.user.uid, ...customerDoc.data() } as Customer);
        }

        // Update last login in users (new)
        await setDoc(doc(db, "users", result.user.uid), {
            lastLogin: serverTimestamp()
        }, { merge: true });

        return result;
    };

    const signupWithEmail = async (email: string, password: string, displayName: string, mobile: string, tenantId: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // 1. Create entry in 'users' collection (The new source of truth for routing)
        await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            name: displayName,
            email: email,
            phone: mobile,
            role: "customer",
            tenantId: tenantId, // Link to the specific Admin/Company (document ID)
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        // 2. Create customer profile (Legacy/Existing requirement)
        const customerData: any = {
            uid: result.user.uid,
            email: email,
            displayName: displayName,
            phoneNumber: mobile,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };

        await setDoc(doc(db, "customers", result.user.uid), customerData);

        // Update customer state
        setCustomer({
            uid: result.user.uid,
            email: email,
            displayName: displayName,
            phoneNumber: mobile,
            createdAt: null,
            lastLogin: null
        } as Customer);

        return result;
    };

    const loginWithGoogle = async (tenantId?: string) => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New User
            if (!tenantId) {
                // If no tenantId provided (e.g. login page without context), we can't properly assign them to a company.
                // For now, we might error out or create a floating user. 
                // But typically Google Login happens on a tenant-specific page.
                console.warn("Google Login: New user but no tenantId provided.");
            }

            await setDoc(userDocRef, {
                uid: user.uid,
                name: user.displayName || "",
                email: user.email || "",
                role: "customer",
                tenantId: tenantId || "", // This might be empty if not provided, which needs handling
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            // Legacy customer doc
            await setDoc(doc(db, "customers", user.uid), {
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || "",
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                photoURL: user.photoURL
            });
        } else {
            // Existing User - update Login
            await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
        }

        return result;
    };

    const logout = async (force: boolean = false) => {
        // Prevent accidental logout from storefront pages
        // Only allow logout from dashboard or with force flag
        if (!force && typeof window !== 'undefined') {
            const path = window.location.pathname;
            // Allow logout only from dashboard pages, login pages, or with force flag
            const allowedPaths = ['/dashboard', '/login', '/admin'];
            const isAllowedPath = allowedPaths.some(p => path.includes(p));

            if (!isAllowedPath) {
                console.warn("Logout blocked from storefront. Use dashboard to logout or call logout(true).");
                return;
            }
        }
        await signOut(auth);
        setCustomer(null);
        setIsAdmin(false);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return {
        customer,
        loading,
        isAdmin,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        resetPassword
    };
}
