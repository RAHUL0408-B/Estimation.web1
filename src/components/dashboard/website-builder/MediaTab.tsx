"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, FileImage } from "lucide-react";

interface MediaTabProps {
    tenantId: string;
}

export default function MediaTab({ tenantId }: MediaTabProps) {
    return (
        <div className="space-y-6">
            <Card className="rounded-xl shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Image className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-xl">Media Library</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileImage className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Media Library</h3>
                        <p className="text-gray-500 max-w-md">
                            Upload and manage images directly within each page section. All uploaded
                            images are automatically organized by page.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
