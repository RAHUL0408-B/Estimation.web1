"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText,
    Users,
    Clock,
    CalendarDays,
    Eye,
    Download,
    AlertCircle,
    Plus,
    List,
    Settings,
    Globe,
    X,
    User,
    Home,
    Layers,
    IndianRupee,
    CheckCircle,
    XCircle
} from "lucide-react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useTenantDashboard, RecentOrder } from "@/hooks/useTenantDashboard";
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
import {
    Dialog,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";
import { doc, updateDoc } from "@/lib/firebaseWrapper";
import { db } from "@/lib/firebase";

import { generateSampleData } from "@/lib/sampleData";

export default function TenantDashboardPage() {
    const { tenant, isAuthenticated, loading: authLoading } = useTenantAuth();
    const stats = useTenantDashboard(tenant?.id || null);
    const router = useRouter();

    const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Generate sample data if needed
    useEffect(() => {
        if (tenant?.id) {
            import("@/lib/seeder").then((module) => {
                module.checkAndSeed(tenant.id);
            });
        }
    }, [tenant?.id]);

    if (authLoading || stats.loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <div className="text-sm text-gray-500">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    if (!tenant) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-orange-100 text-orange-700 hover:bg-orange-100";
            case "approved": return "bg-green-100 text-green-700 hover:bg-green-100";
            case "rejected": return "bg-red-100 text-red-700 hover:bg-red-100";
            case "generated": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
    };

    const formatAmount = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return "-";
        return amount >= 100000
            ? `₹${(amount / 100000).toFixed(1)}L`
            : `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp?.toDate) return "-";
        return timestamp.toDate().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const openDetails = (order: RecentOrder) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleApprove = async (orderId: string) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: "approved" });
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: "approved" });
            }
        } catch (error) {
            console.error("Error approving order:", error);
        }
    };

    const handleReject = async (orderId: string) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: "rejected" });
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: "rejected" });
            }
        } catch (error) {
            console.error("Error rejecting order:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back, {tenant.name.split(' ')[0]}. Here's what's happening today.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Total Estimates
                        </CardTitle>
                        <FileText className="h-5 w-5 text-gray-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-[#0F172A]">{stats.estimatesCount}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Total Client Orders
                        </CardTitle>
                        <Users className="h-5 w-5 text-gray-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-[#0F172A]">{stats.ordersCount}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Pending Approvals
                        </CardTitle>
                        <Clock className="h-5 w-5 text-gray-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-[#0F172A]">{stats.pendingApprovalsCount}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Today's Estimates
                        </CardTitle>
                        <CalendarDays className="h-5 w-5 text-gray-300" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-[#0F172A]">{stats.todayEstimatesCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Needs Your Attention */}
            {(stats.pendingApprovalsCount > 0 || stats.rejectedThisWeekCount > 0) && (
                <Card className="border-none shadow-sm bg-amber-50">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-900">Needs Your Attention</p>
                                <p className="text-sm text-amber-700">
                                    {stats.pendingApprovalsCount > 0 && (
                                        <span>You have <strong>{stats.pendingApprovalsCount}</strong> pending approval{stats.pendingApprovalsCount !== 1 ? 's' : ''}</span>
                                    )}
                                    {stats.pendingApprovalsCount > 0 && stats.rejectedThisWeekCount > 0 && ' · '}
                                    {stats.rejectedThisWeekCount > 0 && (
                                        <span><strong>{stats.rejectedThisWeekCount}</strong> rejected estimate{stats.rejectedThisWeekCount !== 1 ? 's' : ''} this week</span>
                                    )}
                                </p>
                            </div>
                            <Link href="/dashboard/orders">
                                <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100">
                                    View Orders
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link href={`/${tenant.storeId}/estimate`}>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Estimate
                    </Button>
                </Link>
                <Link href="/dashboard/orders">
                    <Button variant="outline" size="sm" className="gap-2">
                        <List className="h-4 w-4" />
                        View All Orders
                    </Button>
                </Link>
                <Link href="/dashboard/pricing">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Pricing & Config
                    </Button>
                </Link>
                <Link href="/dashboard/website-setup">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Website Setup
                    </Button>
                </Link>
            </div>

            {/* Recent Client Estimates Table */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b bg-gray-50/30 py-4 px-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-gray-700">Recent Client Estimates</CardTitle>
                    <Link href="/dashboard/orders">
                        <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                            View All
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-gray-50/20">
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase pl-6">Client</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Phone</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Amount</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Status</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Date</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.recentOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                                        No recent estimates yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stats.recentOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-semibold text-gray-900">{order.clientName || "-"}</div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {order.clientPhone || "-"}
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            {formatAmount(order.estimatedAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("capitalize px-3 py-1 border-none text-[10px] font-bold uppercase", getStatusColor(order.status))}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDetails(order)}
                                                    className="h-8 px-3 text-xs"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    View
                                                </Button>
                                                {order.pdfUrl && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(order.pdfUrl, '_blank')}
                                                        className="h-8 px-3 text-xs"
                                                    >
                                                        <Download className="h-3.5 w-3.5 mr-1" />
                                                        PDF
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Order Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl p-0 gap-0 bg-white border-none shadow-2xl rounded-xl overflow-hidden flex flex-col h-[85vh]">
                    {/* Sticky Header */}
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                            <p className="text-sm text-gray-500">Estimate #{selectedOrder?.estimateId?.slice(-8) || selectedOrder?.id?.slice(-8)}</p>
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
                        {selectedOrder && (
                            <>
                                {/* Client Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                        <User className="h-4 w-4" />
                                        Client Information
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase">Full Name</p>
                                            <p className="font-semibold text-gray-900">{selectedOrder.clientName || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase">Email</p>
                                            <p className="font-semibold text-gray-900">{selectedOrder.clientEmail || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase">Phone</p>
                                            <p className="font-semibold text-gray-900">{selectedOrder.clientPhone || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase">Estimate ID</p>
                                            <p className="font-mono text-sm text-gray-900">{selectedOrder.estimateId || selectedOrder.id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                        <Home className="h-4 w-4" />
                                        Project Details
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                        {selectedOrder.carpetArea && (
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Carpet Area</p>
                                                <p className="font-semibold text-gray-900">{selectedOrder.carpetArea} sqft</p>
                                            </div>
                                        )}
                                        {selectedOrder.numberOfRooms && (
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Number of Rooms</p>
                                                <p className="font-semibold text-gray-900">{selectedOrder.numberOfRooms}</p>
                                            </div>
                                        )}
                                        {(selectedOrder.rooms || selectedOrder.selectedRooms) && (selectedOrder.rooms || selectedOrder.selectedRooms)!.length > 0 && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-400 uppercase mb-2">Selected Rooms / Items</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(selectedOrder.rooms || selectedOrder.selectedRooms)!.map((room, idx) => (
                                                        <Badge key={idx} variant="outline" className="bg-white text-gray-700">
                                                            {room}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Specifications */}
                                {(selectedOrder.materialGrade || selectedOrder.finishType) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <Layers className="h-4 w-4" />
                                            Specifications
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                            {selectedOrder.materialGrade && (
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Material Grade</p>
                                                    <p className="font-semibold text-gray-900">{selectedOrder.materialGrade}</p>
                                                </div>
                                            )}
                                            {selectedOrder.finishType && (
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Finish Type</p>
                                                    <p className="font-semibold text-gray-900">{selectedOrder.finishType}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Estimate Summary */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                        <IndianRupee className="h-4 w-4" />
                                        Summary
                                    </div>
                                    <div className="bg-[#0F172A] rounded-lg p-6 text-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-400">Estimated Amount</span>
                                            <span className="text-3xl font-bold">{formatAmount(selectedOrder.estimatedAmount)}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                            <span className="text-gray-400">Status</span>
                                            <Badge className={cn("capitalize px-3 py-1", getStatusColor(selectedOrder.status))}>
                                                {selectedOrder.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between pt-4">
                                            <span className="text-gray-400">Created</span>
                                            <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sticky Footer */}
                    <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50">
                        <div className="flex gap-2">
                            {selectedOrder?.pdfUrl && (
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(selectedOrder.pdfUrl, '_blank')}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {selectedOrder?.status === "pending" && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => selectedOrder && handleReject(selectedOrder.id)}
                                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => selectedOrder && handleApprove(selectedOrder.id)}
                                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve
                                    </Button>
                                </>
                            )}
                            {selectedOrder?.status !== "pending" && (
                                <DialogClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DialogClose>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
