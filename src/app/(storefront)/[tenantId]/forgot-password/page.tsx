"use client";

import { useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import Link from "next/link";

export default function ForgotPasswordPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const { resetPassword } = useCustomerAuth();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setIsLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-8 space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                            </div>
                            <Link href={`/${tenantId}/login`}>
                                <Button className="mt-4">Back to Login</Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full h-12" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending reset link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!success && (
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link href={`/${tenantId}/login`} className="text-primary hover:underline font-semibold">
                                Login
                            </Link>
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
