"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { Mail, Lock, User, Briefcase, ArrowRight, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collectionGroup, query, where, getDocs, signInWithGoogle } from "@/lib/supabaseWrapper";
import { db } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function TenantLoginPage() {
    // Designer tab state
    const [designerEmail, setDesignerEmail] = useState("");
    const [designerPassword, setDesignerPassword] = useState("");
    // Employee tab state
    const [employeeEmail, setEmployeeEmail] = useState("");
    const [employeePassword, setEmployeePassword] = useState("");

    const { login, loading: designerLoading, error: designerError, isAuthenticated } = useTenantAuth();

    const [employeeLoading, setEmployeeLoading] = useState(false);
    const [employeeError, setEmployeeError] = useState("");

    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        const empSession = sessionStorage.getItem("employeeSession");
        if (empSession) {
            router.push("/employee-dashboard");
        }
    }, [router]);

    const handleDesignerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(designerEmail, designerPassword);
        if (success) {
            router.push("/dashboard");
        }
    };

    const handleEmployeeLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmployeeLoading(true);
        setEmployeeError("");

        try {
            const employeesRef = collectionGroup(db, "employees");
            const q = query(employeesRef, where("email", "==", employeeEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setEmployeeError("Account not found. Please check your email.");
                setEmployeeLoading(false);
                return;
            }

            let inputsValid = false;
            let employeeData: any = null;

            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                if (data.password === employeePassword) {
                    inputsValid = true;
                    // tenantId is stored in data.tenantId (set when employee was created)
                    const tenantId = data.tenantId || "";
                    employeeData = { id: docSnap.id, ...data, tenantId };
                    break;
                }
            }

            if (inputsValid && employeeData) {
                sessionStorage.setItem("employeeSession", JSON.stringify(employeeData));
                router.push("/employee-dashboard");
            } else {
                setEmployeeError("Incorrect password. Please try again.");
            }
        } catch (error: any) {
            console.error("Employee login error:", error);
            setEmployeeError(`Login failed: ${error.message || "Unknown error"}.`);
        } finally {
            setEmployeeLoading(false);
        }
    };

    if (isAuthenticated) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 selection:bg-black selection:text-white">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gray-50/50 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gray-50/50 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg z-10"
            >
                <div className="flex flex-col items-center mb-12">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4">
                        U
                    </div>
                    <h1 className="text-sm font-bold tracking-[0.3em] text-black uppercase">unmatrix.io</h1>
                </div>

                <Card className="rounded-xl border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white overflow-hidden">
                    <CardHeader className="pt-10 pb-4 px-10 text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight text-black">Welcome back</CardTitle>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Sign in to manage your studio operations</p>
                    </CardHeader>
                    <CardContent className="px-10 pb-12">
                        <Tabs defaultValue="designer" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-10 bg-gray-100/50 p-1 rounded-lg">
                                <TabsTrigger value="designer" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider h-9 transition-all text-gray-400">Designer</TabsTrigger>
                                <TabsTrigger value="employee" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider h-9 transition-all text-gray-400">Employee</TabsTrigger>
                            </TabsList>

                            <TabsContent value="designer">
                                <form onSubmit={handleDesignerLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="d-email" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-4 h-4 w-4 text-gray-300" />
                                            <Input
                                                id="d-email"
                                                className="pl-12 rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                                type="email"
                                                placeholder="Email address"
                                                value={designerEmail}
                                                onChange={(e) => setDesignerEmail(e.target.value)}
                                                required
                                                disabled={designerLoading}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="d-password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</Label>
                                            <Link href="/forgot-password" className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-wider">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-4 h-4 w-4 text-gray-300" />
                                            <Input
                                                id="d-password"
                                                className="pl-12 rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                                type="password"
                                                placeholder="Password"
                                                value={designerPassword}
                                                onChange={(e) => setDesignerPassword(e.target.value)}
                                                required
                                                disabled={designerLoading}
                                            />
                                        </div>
                                    </div>
                                    {designerError && (
                                        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100">
                                            {designerError}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white h-12 rounded-lg text-sm font-bold transition-all shadow-lg shadow-black/5 group" disabled={designerLoading}>
                                        {designerLoading ? "Signing in..." : (
                                            <span className="flex items-center gap-2">
                                                Sign In
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>

                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-gray-200" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full bg-white hover:bg-gray-50 text-black border-gray-200 h-12 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                                        onClick={async () => {
                                            await signInWithGoogle(window.location.origin + '/dashboard');
                                        }}
                                        disabled={designerLoading}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Sign in with Google
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="employee">
                                <form onSubmit={handleEmployeeLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="e-email" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-4 h-4 w-4 text-gray-300" />
                                            <Input
                                                id="e-email"
                                                className="pl-12 rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                                type="email"
                                                placeholder="Email address"
                                                value={employeeEmail}
                                                onChange={(e) => setEmployeeEmail(e.target.value)}
                                                required
                                                disabled={employeeLoading}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="e-password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Access Key</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-4 h-4 w-4 text-gray-300" />
                                            <Input
                                                id="e-password"
                                                className="pl-12 rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                                type="password"
                                                placeholder="Access Key"
                                                value={employeePassword}
                                                onChange={(e) => setEmployeePassword(e.target.value)}
                                                required
                                                disabled={employeeLoading}
                                            />
                                        </div>
                                    </div>
                                    {employeeError && (
                                        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100">
                                            {employeeError}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white h-12 rounded-lg text-sm font-bold transition-all shadow-lg shadow-black/5 group" disabled={employeeLoading}>
                                        {employeeLoading ? "Signing in..." : (
                                            <span className="flex items-center gap-2">
                                                Sign In
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-10 pt-8 border-t border-gray-50 text-center text-sm font-medium text-gray-400">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-black hover:text-gray-600 transition-colors underline underline-offset-4">
                                Create account
                            </Link>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-12 text-center opacity-30">
                    <Shield className="mx-auto w-5 h-5 text-black" />
                </div>
            </motion.div>
        </div>
    );
}
