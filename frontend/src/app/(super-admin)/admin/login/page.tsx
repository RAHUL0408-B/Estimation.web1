"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, loading, user } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/admin/dashboard");
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const success = await login(email, password);
            if (!success) {
                setError("Invalid admin credentials. Access denied.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during login");
        }
    };

    if (loading && !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500 font-medium">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
                <CardHeader className="text-center space-y-1">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Super Admin access</CardTitle>
                    <CardDescription>Login to manage the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center font-medium animate-pulse">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Admin ID (Email)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="admin@platform.com"
                                    className="pl-10 h-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-3">
                        <p className="text-xs text-gray-400">
                            New Admin?{" "}
                            <Link href="/admin/signup" className="text-slate-900 hover:underline font-bold">
                                Create Admin Account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-2">
                        <div className="flex items-center text-xs text-gray-400 gap-1 uppercase tracking-widest font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            Secure Admin Portal
                        </div>
                        <p className="text-[10px] text-gray-300">Protected by platform-level encryption</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
