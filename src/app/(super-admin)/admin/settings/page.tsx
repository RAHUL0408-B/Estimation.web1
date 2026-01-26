"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SuperAdminSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
                <p className="text-muted-foreground">
                    Configure platform-wide settings and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Configuration</CardTitle>
                        <CardDescription>Manage global platform settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="platform-name">Platform Name</Label>
                                <Input id="platform-name" defaultValue="Interior Design Platform" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support-email">Support Email</Label>
                                <Input id="support-email" defaultValue="support@platform.com" />
                            </div>
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Plans</CardTitle>
                        <CardDescription>Manage pricing tiers for companies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="basic-price">Basic Plan</Label>
                                <Input id="basic-price" type="number" defaultValue="29" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pro-price">Pro Plan</Label>
                                <Input id="pro-price" type="number" defaultValue="79" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enterprise-price">Enterprise Plan</Label>
                                <Input id="enterprise-price" type="number" defaultValue="199" />
                            </div>
                        </div>
                        <Button>Update Pricing</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>Configure security and authentication.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                            </div>
                            <Button variant="outline">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Session Timeout</p>
                                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                            </div>
                            <Input className="w-32" type="number" defaultValue="30" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
