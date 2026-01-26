"use client";

import { MessageSquare, MoreHorizontal } from "lucide-react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useConsultations } from "@/hooks/useConsultations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ConsultationRequestsPage() {
    const { tenant } = useTenantAuth();
    const { requests, stats, loading } = useConsultations(tenant?.id || null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "new": return "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50";
            case "contacted": return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50 uppercase text-[10px] font-bold";
            case "closed": return "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-50";
            default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading requests...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Consultation Requests</h1>
                <p className="text-gray-500 text-sm">Manage incoming design leads and requests</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">New Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-600">{stats.new}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-gray-900">{stats.inProgress}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-green-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">{stats.conversionRate}%</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {requests.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No consultation requests yet</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Client Name</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Phone</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Source</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Requirement</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Date</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <p className="font-semibold text-gray-900">{request.clientName}</p>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {request.phone || request.phoneNumber || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none uppercase text-[9px] font-bold px-2 py-0.5">
                                                {request.source || "website"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-gray-600 line-clamp-2 max-w-[250px]">{request.requirement}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("px-3 py-1 capitalize", getStatusColor(request.status))}>
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {request.createdAt?.toDate().toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
