"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";

interface StorefrontAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "login" | "signup";
    tenantId: string;
}

export function StorefrontAuthDialog({
    open,
    onOpenChange,
    defaultTab = "login",
    tenantId
}: StorefrontAuthDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);

    // Sync active tab with defaultTab when dialog opens
    useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate authentication
        // In a real app, this would verify credentials with Firebase Auth

        setTimeout(() => {
            // Get form values using FormData to be generic across tabs
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get("email") as string || formData.get("signup-email") as string;
            const name = (formData.get("firstName") as string)
                ? `${formData.get("firstName")} ${formData.get("lastName")}`
                : "User";

            if (email) {
                // Save user session to localStorage
                const userSession = {
                    email,
                    name,
                    isLoggedIn: true,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem(`storefront_user_${tenantId}`, JSON.stringify(userSession));

                // Trigger an event so hooks can update immediately (optional but good practice)
                window.dispatchEvent(new Event("storage"));
            }

            setIsLoading(false);
            onOpenChange(false);
            router.push(`/${tenantId}/dashboard`);
        }, 1500);
    }

    const handleForgotPassword = () => {
        // TODO: Implement forgot password logic
        alert("Forgot password functionality would open here.");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        {activeTab === "login" ? "Welcome Back" : "Create Account"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {activeTab === "login"
                            ? "Enter your credentials to access your account"
                            : "Enter your details to create a new account"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="link"
                                    className="px-0 font-normal h-auto text-xs text-muted-foreground hover:text-primary"
                                    type="button"
                                    onClick={handleForgotPassword}
                                >
                                    Forgot password?
                                </Button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" name="firstName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" name="lastName" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" name="signup-email" type="email" placeholder="name@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" name="signup-password" type="password" required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
