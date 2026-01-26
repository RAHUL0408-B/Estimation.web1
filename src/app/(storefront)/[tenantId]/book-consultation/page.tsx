"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getTenantByStoreId, Tenant } from "@/lib/firestoreHelpers";

export default function BookConsultationPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: storeSlug } = use(params);
    const router = useRouter();
    const { customer, loading: authLoading } = useCustomerAuth();

    // Resolve store slug to actual tenant document ID
    const [resolvedTenant, setResolvedTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);

    useEffect(() => {
        const resolveTenant = async () => {
            try {
                const tenant = await getTenantByStoreId(storeSlug);
                setResolvedTenant(tenant);
            } catch (error) {
                console.error("Error resolving tenant:", error);
            } finally {
                setTenantLoading(false);
            }
        };
        resolveTenant();
    }, [storeSlug]);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [requirement, setRequirement] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Pre-fill form if logged in
    useEffect(() => {
        if (customer) {
            setName(customer.displayName || "");
            setPhone(customer.phoneNumber || "");
            setEmail(customer.email || "");
        }
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resolvedTenant?.id) {
            alert("Unable to submit. Please try again.");
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "consultation_requests"), {
                tenantId: resolvedTenant.id,
                storeId: storeSlug,
                clientName: name,
                phone: phone,
                email: email,
                source: "website",
                requirement: requirement,
                status: "new",
                createdAt: serverTimestamp(),
                userId: customer?.uid || null
            });

            setIsSuccess(true);
        } catch (error) {
            console.error("Error submitting consultation:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || tenantLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl">Request Submitted!</CardTitle>
                        <CardDescription>
                            Thank you for your interest. Our design team will contact you shortly to schedule your consultation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => router.push(`/${storeSlug}`)}
                            className="w-full"
                        >
                            Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <h1 className="text-3xl font-serif font-bold text-center mb-8">Book a Design Consultation</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Tell us about your project</CardTitle>
                    <CardDescription>
                        Fill out the form below and we'll get back to you to discuss your dream space.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="Enter your mobile number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirement">Requirement</Label>
                            <Textarea
                                id="requirement"
                                placeholder="Describe your project (e.g., 3BHK interior, Kitchen renovation, etc.)"
                                value={requirement}
                                onChange={(e) => setRequirement(e.target.value)}
                                required
                                className="min-h-[120px]"
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Request"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
