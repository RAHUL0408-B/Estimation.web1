"use client";

import { useState } from "react";
import { Search, Download, Package, FileText, Eye, User, Home, Layers, IndianRupee, X, Pencil } from "lucide-react";
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

export default function OrdersPage() {
    const { tenant } = useTenantAuth();
    const { orders, stats, loading, updateOrderStatus, updateOrderDetails } = useOrders(tenant?.id || null, tenant?.storeId || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        carpetArea: "",
        numberOfRooms: "",
        materialGrade: "",
        finishType: "",
    });

    const searchLower = searchQuery.toLowerCase();
    const filteredOrders = orders.filter(o =>
        o.clientName?.toLowerCase()?.includes(searchLower) ||
        o.clientPhone?.includes(searchQuery) ||
        o.clientEmail?.toLowerCase()?.includes(searchLower)
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

    const openDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
        setIsEditing(false);
    };

    const startEditing = () => {
        if (selectedOrder) {
            setEditForm({
                clientName: selectedOrder.clientName || "",
                clientEmail: selectedOrder.clientEmail || "",
                clientPhone: selectedOrder.clientPhone || "",
                carpetArea: selectedOrder.carpetArea?.toString() || "",
                numberOfRooms: selectedOrder.numberOfRooms?.toString() || "",
                materialGrade: selectedOrder.materialGrade || "",
                finishType: selectedOrder.finishType || "",
            });
            setIsEditing(true);
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        if (!selectedOrder) return;

        setIsSaving(true);
        const updates: Partial<Order> = {
            clientName: editForm.clientName,
            clientEmail: editForm.clientEmail,
            clientPhone: editForm.clientPhone,
            carpetArea: editForm.carpetArea ? parseInt(editForm.carpetArea) : undefined,
            numberOfRooms: editForm.numberOfRooms ? parseInt(editForm.numberOfRooms) : undefined,
            materialGrade: editForm.materialGrade,
            finishType: editForm.finishType,
        };

        const success = await updateOrderDetails(selectedOrder.id, updates);
        if (success) {
            setSelectedOrder({ ...selectedOrder, ...updates });
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "-";
        return timestamp.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return "-";
        return timestamp.toDate().toLocaleString("en-US", {
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
        return amount >= 100000
            ? `₹${(amount / 100000).toFixed(1)}L`
            : `₹${amount.toLocaleString('en-IN')}`;
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
                                    <TableHead className="text-[10px] font-bold text-gray-400 uppercase">Phone</TableHead>
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
                                            <div className="font-semibold text-gray-900">{order.clientName || "-"}</div>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {order.clientPhone || "-"}
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            {formatAmount(order.estimatedAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("capitalize px-3 py-1 border-none", getStatusColor(order.status))}>
                                                {order.status}
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
                                                View Details
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
                <DialogContent className="max-w-[720px] h-[85vh] overflow-hidden flex flex-col">
                    {selectedOrder && (
                        <>
                            {/* Sticky Header */}
                            <div className="shrink-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                                <DialogClose asChild>
                                    <button className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </DialogClose>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
                                {isEditing ? (
                                    /* Edit Mode */
                                    <div className="space-y-4">
                                        {/* Client Information - Edit */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                                <User className="h-4 w-4 text-gray-500" />
                                                Client Information
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Full Name</label>
                                                    <Input
                                                        value={editForm.clientName}
                                                        onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Phone Number</label>
                                                    <Input
                                                        value={editForm.clientPhone}
                                                        onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Email</label>
                                                    <Input
                                                        type="email"
                                                        value={editForm.clientEmail}
                                                        onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estimate ID</p>
                                                    <p className="text-sm font-mono text-gray-600 py-2">{selectedOrder.estimateId}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project Details - Edit */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                                <Home className="h-4 w-4 text-gray-500" />
                                                Project Details
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Carpet Area (sqft)</label>
                                                    <Input
                                                        type="number"
                                                        value={editForm.carpetArea}
                                                        onChange={(e) => setEditForm({ ...editForm, carpetArea: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Number of Rooms</label>
                                                    <Input
                                                        type="number"
                                                        value={editForm.numberOfRooms}
                                                        onChange={(e) => setEditForm({ ...editForm, numberOfRooms: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                {(selectedOrder.rooms || selectedOrder.selectedRooms) && (selectedOrder.rooms || selectedOrder.selectedRooms)!.length > 0 && (
                                                    <div className="col-span-1 sm:col-span-2">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Selected Rooms</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(selectedOrder.rooms || selectedOrder.selectedRooms)!.map((room, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs bg-white border border-gray-200">
                                                                    {room}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Specifications - Edit */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                                <Layers className="h-4 w-4 text-gray-500" />
                                                Specifications
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Material Grade</label>
                                                    <Input
                                                        value={editForm.materialGrade}
                                                        onChange={(e) => setEditForm({ ...editForm, materialGrade: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Finish Type</label>
                                                    <Input
                                                        value={editForm.finishType}
                                                        onChange={(e) => setEditForm({ ...editForm, finishType: e.target.value })}
                                                        className="bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <>
                                        {/* Client Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    Client Information
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                                    onClick={startEditing}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                                    Update
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedOrder.clientName && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                                                        <p className="text-sm font-medium text-gray-900">{selectedOrder.clientName}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.clientPhone && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                                                        <p className="text-sm font-medium text-gray-900">{selectedOrder.clientPhone}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.clientEmail && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                                                        <p className="text-sm font-medium text-gray-900">{selectedOrder.clientEmail}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estimate ID</p>
                                                    <p className="text-sm font-mono text-gray-600">{selectedOrder.estimateId}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project Details */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                                <Home className="h-4 w-4 text-gray-500" />
                                                Project Details
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedOrder.carpetArea !== undefined && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Carpet Area</p>
                                                        <p className="text-sm font-medium text-gray-900">{selectedOrder.carpetArea} sqft</p>
                                                    </div>
                                                )}
                                                {selectedOrder.numberOfRooms !== undefined && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Number of Rooms</p>
                                                        <p className="text-sm font-medium text-gray-900">{selectedOrder.numberOfRooms}</p>
                                                    </div>
                                                )}
                                                {(selectedOrder.rooms || selectedOrder.selectedRooms) && (selectedOrder.rooms || selectedOrder.selectedRooms)!.length > 0 && (
                                                    <div className="col-span-1 sm:col-span-2">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Selected Rooms</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(selectedOrder.rooms || selectedOrder.selectedRooms)!.map((room, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs bg-white border border-gray-200">
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
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                                    <Layers className="h-4 w-4 text-gray-500" />
                                                    Specifications
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {selectedOrder.materialGrade && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Material Grade</p>
                                                            <p className="text-sm font-medium text-gray-900">{selectedOrder.materialGrade}</p>
                                                        </div>
                                                    )}
                                                    {selectedOrder.finishType && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Finish Type</p>
                                                            <p className="text-sm font-medium text-gray-900">{selectedOrder.finishType}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Estimate Summary */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
                                                <IndianRupee className="h-4 w-4 text-gray-500" />
                                                Estimate Summary
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedOrder.estimatedAmount !== undefined && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estimated Amount</p>
                                                        <p className="text-2xl font-bold text-gray-900">{formatAmount(selectedOrder.estimatedAmount)}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                                                    <Badge className={cn("capitalize px-3 py-1.5 border-none text-sm", getStatusColor(selectedOrder.status))}>
                                                        {selectedOrder.status}
                                                    </Badge>
                                                </div>
                                                {selectedOrder.createdAt && (
                                                    <div className="col-span-1 sm:col-span-2">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                                                        <p className="text-sm text-gray-700">{formatDateTime(selectedOrder.createdAt)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap justify-end gap-3">
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                            onClick={cancelEditing}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={handleSaveChanges}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
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

                                        {selectedOrder.status === "pending" && (
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
