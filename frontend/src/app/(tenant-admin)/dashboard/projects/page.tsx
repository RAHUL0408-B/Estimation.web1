"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default function ProjectsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-sm text-gray-500">Manage ongoing projects and construction sites.</p>
                </div>
            </div>

            <Card className="border-dashed border-2 bg-gray-50">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="bg-indigo-100 p-4 rounded-full mb-4">
                        <Hammer className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Project Management Module</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-2">
                        This module will track active projects converted from approved leads. You can manage timelines, budget, and teams here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
