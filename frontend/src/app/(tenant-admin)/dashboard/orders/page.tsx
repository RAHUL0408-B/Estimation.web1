"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown, Search, Filter, Eye, MoreHorizontal, Download, Trash2, Calendar, FileText, CheckCircle, XCircle, Clock, Activity, Package, X, User, Home, Layers, IndianRupee } from "lucide-react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useOrders, Order } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Employee {
    id: string;
    name: string;
}

export default function OrdersPage() {
    const { tenant } = useTenantAuth();
    const { orders, stats, loading, updateOrderStatus, updateOrderDetails } = useOrders(tenant?.id || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!tenant?.id) return;
            try {
                const employeesRef = collection(db, "tenants", tenant.id, "employees");
                const snapshot = await getDocs(employeesRef);
                const empList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setEmployees(empList);
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };
        fetchEmployees();
    }, [tenant?.id]);

    const searchLower = searchQuery.toLowerCase();
    const filteredOrders = orders.filter(o =>
        (o.customerInfo?.name || o.clientName || "").toLowerCase().includes(searchLower) ||
        (o.customerInfo?.phone || o.clientPhone || "").includes(searchQuery) ||
        (o.customerInfo?.email || o.clientEmail || "").toLowerCase().includes(searchLower)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-orange-100 text-orange-700 hover:bg-orange-100";
            case "approved": return "bg-green-100 text-green-700 hover:bg-green-100";
            case "rejected": return "bg-red-100 text-red-700 hover:bg-red-100";
            case "generated": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
    };

    const handleApprove = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, "approved");
        if (success && selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: "approved" });
        }
    };

    const handleReject = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, "rejected");
        if (success && selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: "rejected" });
        }
    };

    const handleAssign = async (employeeId: string) => {
        if (!selectedOrder) return;
        const employeeName = employees.find(e => e.id === employeeId)?.name || "Unknown";

        const updates = {
            assignedTo: employeeId,
            assignedToName: employeeName,
            status: "approved" as const // Auto-approve upon assignment if desired, or keep separate
        };

        const success = await updateOrderDetails(selectedOrder.id, updates);

        if (success) {
            setSelectedOrder({
                ...selectedOrder,
                ...updates
            });
        }
    };

    const openDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "-";
        // Handle Firestore timestamp
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return "-";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };

    const formatAmount = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return "-";
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading orders...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 text-sm">Manage estimate requests from your website</p>
                </div>
                <Button variant="outline" className="border-gray-200">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-sm bg-orange-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-red-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gray-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalValue ? `₹${(stats.totalValue / 100000).toFixed(1)}L` : "₹0"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by client name, email, or phone..."
                    className="pl-10 bg-white border-gray-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Clean Summary Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No orders found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Client</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Allocated To</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Plan</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Amount</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Date</TableHead>
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetails(order)}>
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">{order.customerInfo?.name || order.clientName || "-"}</div>
                                            <div className="text-xs text-gray-500">{order.customerInfo?.phone || order.clientPhone}</div>
                                        </TableCell>
                                        <TableCell>
                                            {order.assignedToName ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                                        {order.assignedToName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-gray-700">{order.assignedToName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {order.plan ? <Badge variant="outline">{order.plan}</Badge> : "-"}
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            {formatAmount(order.totalAmount || order.estimatedAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("capitalize px-3 py-1 border-none", getStatusColor(order.status || 'pending'))}>
                                                {order.status || 'pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => openDetails(order)}
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Order Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-[800px] h-[90vh] overflow-hidden flex flex-col">
                    {selectedOrder && (
                        <>
                            {/* Sticky Header */}
                            <div className="shrink-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Estimate Details</h2>
                                    <p className="text-xs text-gray-500">ID: {selectedOrder.id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Assignment Dropdown */}
                                    <div className="w-[200px]">
                                        <Select
                                            value={selectedOrder.assignedTo || "unassigned"}
                                            onValueChange={handleAssign}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Assign Employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned" disabled>Assign to...</SelectItem>
                                                {employees.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogClose asChild>
                                        <button className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
                                            <X className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </DialogClose>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">

                                {/* Client Information */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                        <User className="h-4 w-4 text-gray-500" />
                                        Customer Information
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedOrder.customerInfo?.name || selectedOrder.clientName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedOrder.customerInfo?.phone || selectedOrder.clientPhone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedOrder.customerInfo?.email || selectedOrder.clientEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">City</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedOrder.customerInfo?.city || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Assigned To</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedOrder.assignedToName || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Assignment Status</p>
                                            <Badge variant="outline" className="mt-1 capitalize">
                                                {selectedOrder.assignmentStatus || "Pending"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Timeline View for Admin */}
                                    <div className="mt-6 border-t pt-4">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-gray-500" />
                                            Tracking History
                                        </h4>
                                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                                            {/* Initial Creation */}
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-300 border-2 border-white"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                    <p className="text-sm font-medium text-gray-900">Order Created</p>
                                                    <div className="text-xs text-gray-400">
                                                        {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : "-"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Timeline */}
                                            {selectedOrder.timeline?.map((event, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${event.status === 'completed' || event.status === 'successful' ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}></div>
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 capitalize">{event.status}</p>
                                                            <p className="text-xs text-gray-500">Updated by: {event.updatedBy || "Unknown"}</p>
                                                            {event.note && (
                                                                <p className="text-xs text-gray-500 mt-1 max-w-sm bg-gray-50 p-2 rounded italic">
                                                                    "{event.note}"
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400 whitespace-nowrap">
                                                            {event.timestamp?.toDate ? event.timestamp.toDate().toLocaleString() : "-"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Project Overview */}
                                <div className="bg-white border rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                        <Home className="h-4 w-4 text-gray-500" />
                                        Project Overview
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-3 rounded-md">
                                            <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Plan</p>
                                            <p className="font-bold text-blue-900">{selectedOrder.plan || "-"}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Segment</p>
                                            <p className="font-medium text-gray-900">{selectedOrder.segment || "-"}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Carpet Area</p>
                                            <p className="font-medium text-gray-900">{selectedOrder.carpetArea} sqft</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bedrooms</p>
                                            <p className="font-medium text-gray-900">{selectedOrder.bedrooms || selectedOrder.numberOfRooms || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bathrooms</p>
                                            <p className="font-medium text-gray-900">{selectedOrder.bathrooms || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Configuration */}
                                {selectedOrder.configuration && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 border-b pb-2">Item Breakdown</h3>

                                        {/* Living Area */}
                                        {selectedOrder.configuration.livingArea && Object.keys(selectedOrder.configuration.livingArea).length > 0 && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-sm text-gray-700 mb-3 uppercase tracking-wide">Living Area</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {Object.entries(selectedOrder.configuration.livingArea).map(([itemId, qty]) => (
                                                        qty > 0 && <div key={itemId} className="flex justify-between bg-white p-2 rounded border">
                                                            <span>{itemId.replace('la_', '').replace(/_/g, ' ')}</span>
                                                            <Badge variant="secondary">Qty: {qty}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Kitchen */}
                                        {selectedOrder.configuration.kitchen && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-sm text-gray-700 mb-3 uppercase tracking-wide">Kitchen</h4>
                                                <div className="mb-3 flex gap-4 text-sm">
                                                    <Badge variant="outline" className="bg-white">Layout: {selectedOrder.configuration.kitchen.layout}</Badge>
                                                    <Badge variant="outline" className="bg-white">Material: {selectedOrder.configuration.kitchen.material}</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {selectedOrder.configuration.kitchen.items && Object.entries(selectedOrder.configuration.kitchen.items).map(([itemId, qty]) => (
                                                        qty > 0 && <div key={itemId} className="flex justify-between bg-white p-2 rounded border">
                                                            <span>{itemId}</span>
                                                            <Badge variant="secondary">Qty: {qty}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Financials */}
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium mb-1">Total Estimated Amount</p>
                                            <div className="text-3xl font-bold text-blue-900">
                                                {formatAmount(selectedOrder.totalAmount || selectedOrder.estimatedAmount)}
                                            </div>
                                        </div>
                                        <Badge className={cn("text-sm px-3 py-1", getStatusColor(selectedOrder.status || 'pending'))}>
                                            {selectedOrder.status || 'pending'}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-blue-600">
                                        Created on {formatDateTime(selectedOrder.createdAt)}
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="shrink-0 bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3">
                                {selectedOrder.pdfUrl && (
                                    <Button
                                        variant="outline"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={() => window.open(selectedOrder.pdfUrl, '_blank')}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                )}

                                {(selectedOrder.status === "pending" || !selectedOrder.status) && (
                                    <>
                                        <Button
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                            onClick={() => handleReject(selectedOrder.id)}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleApprove(selectedOrder.id)}
                                        >
                                            Approve
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
