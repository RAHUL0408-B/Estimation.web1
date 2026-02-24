"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Search, CheckCircle, Clock, XCircle, Check, X, Edit,
    Trash2, MoreVertical, ShieldOff, ShieldCheck, AlertTriangle, Loader2
} from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";
import { AddCompanyDialog } from "@/components/AddCompanyDialog";
import { approveTenant, rejectTenant, updateDesigner } from "@/lib/firestoreHelpers";
import { db } from "@/lib/supabaseClient";
import { doc, deleteDoc, updateDoc, serverTimestamp } from "@/lib/supabaseWrapper";

interface Company {
    id: string;
    name: string;
    email: string;
    businessName: string;
    storeId: string;
    status: string;
    blockedUntil?: string;
    revenue?: { thisMonth?: number };
}

type ActionType = "activate" | "block" | "delete" | "edit" | null;

export default function CompaniesPage() {
    const { companies, loading, searchQuery, setSearchQuery, filteredCount, totalCount } = useCompanies();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Action modal state
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [blockDays, setBlockDays] = useState("7");
    const [editFormData, setEditFormData] = useState({ name: "", businessName: "", status: "" });

    const openAction = (company: Company, type: ActionType) => {
        setSelectedCompany(company);
        setActionType(type);
        if (type === "edit") {
            setEditFormData({ name: company.name, businessName: company.businessName, status: company.status });
        }
    };

    const closeAction = () => {
        setSelectedCompany(null);
        setActionType(null);
        setBlockDays("7");
    };

    // ── Activate ──────────────────────────────────────────────
    const handleActivate = async () => {
        if (!selectedCompany) return;
        setActionLoading(selectedCompany.id);
        try {
            await approveTenant(selectedCompany.id);
            closeAction();
        } catch (e) {
            console.error(e);
            alert("Failed to activate company");
        } finally { setActionLoading(null); }
    };

    // ── Block for N days ──────────────────────────────────────
    const handleBlock = async () => {
        if (!selectedCompany) return;
        setActionLoading(selectedCompany.id);
        try {
            const days = parseInt(blockDays) || 7;
            const blockedUntil = new Date();
            blockedUntil.setDate(blockedUntil.getDate() + days);
            const tenantRef = doc(db, "tenants", selectedCompany.id);
            await updateDoc(tenantRef, {
                status: "inactive",
                blockedUntil: blockedUntil.toISOString(),
                blockedAt: serverTimestamp(),
            });
            closeAction();
        } catch (e) {
            console.error(e);
            alert("Failed to block company");
        } finally { setActionLoading(null); }
    };

    // ── Permanently Delete ────────────────────────────────────
    const handlePermanentDelete = async () => {
        if (!selectedCompany) return;
        setActionLoading(selectedCompany.id);
        try {
            const tenantRef = doc(db, "tenants", selectedCompany.id);
            await deleteDoc(tenantRef);
            closeAction();
        } catch (e) {
            console.error(e);
            alert("Failed to delete company");
        } finally { setActionLoading(null); }
    };

    // ── Edit ─────────────────────────────────────────────────
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        setActionLoading(selectedCompany.id);
        try {
            await updateDesigner(selectedCompany.id, {
                name: editFormData.name,
                businessName: editFormData.businessName,
                status: editFormData.status as any,
            });
            closeAction();
        } catch (e) {
            console.error(e);
            alert("Failed to update company");
        } finally { setActionLoading(null); }
    };

    const isBlocked = (company: Company) => {
        if (company.status === "inactive" && company.blockedUntil) {
            return new Date(company.blockedUntil) > new Date();
        }
        return false;
    };

    const getBlockedUntilText = (company: Company) => {
        if (!company.blockedUntil) return "";
        const date = new Date(company.blockedUntil);
        return `Until ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    };

    const getStatusBadge = (company: Company) => {
        const status = company.status;
        const blocked = isBlocked(company);

        if (blocked) return (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700">
                <ShieldOff className="h-3 w-3" />
                Blocked · {getBlockedUntilText(company)}
            </span>
        );

        const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
            active: { cls: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" />, label: "Active" },
            pending: { cls: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3 w-3" />, label: "Pending" },
            inactive: { cls: "bg-gray-100 text-gray-700", icon: <XCircle className="h-3 w-3" />, label: "Inactive" },
            rejected: { cls: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" />, label: "Rejected" },
        };
        const b = map[status] || map.pending;
        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${b.cls}`}>
                {b.icon}{b.label}
            </span>
        );
    };

    const isProcessing = (id: string) => actionLoading === id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                    <p className="text-muted-foreground">Manage company accounts and permissions.</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>Add Company</Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search companies..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {searchQuery && (
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredCount} of {totalCount} companies
                    </p>
                )}
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Companies <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount})</span></CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading companies...
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? "No companies found matching your search" : "No companies yet"}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-left p-4 font-medium text-sm">Admin Name</th>
                                        <th className="text-left p-4 font-medium text-sm">Email</th>
                                        <th className="text-left p-4 font-medium text-sm">Company</th>
                                        <th className="text-left p-4 font-medium text-sm">Status</th>
                                        <th className="text-left p-4 font-medium text-sm">Revenue</th>
                                        <th className="text-right p-4 font-medium text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company) => (
                                        <tr key={company.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-medium">{company.name}</td>
                                            <td className="p-4 text-muted-foreground text-sm">{company.email}</td>
                                            <td className="p-4">
                                                <a
                                                    href={`/${company.storeId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline font-medium"
                                                >
                                                    {company.businessName}
                                                </a>
                                            </td>
                                            <td className="p-4">{getStatusBadge(company as Company)}</td>
                                            <td className="p-4 font-medium">
                                                ₹{(company as Company).revenue?.thisMonth?.toLocaleString("en-IN") || 0}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Quick Approve for pending */}
                                                    {company.status === "pending" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => openAction(company as Company, "activate")}
                                                            disabled={isProcessing(company.id)}
                                                        >
                                                            <Check className="h-4 w-4 mr-1" /> Approve
                                                        </Button>
                                                    )}
                                                    {/* 3-dot dropdown for all actions */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                disabled={isProcessing(company.id)}
                                                            >
                                                                {isProcessing(company.id)
                                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                    : <MoreVertical className="h-4 w-4" />
                                                                }
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => openAction(company as Company, "edit")}>
                                                                <Edit className="h-4 w-4 mr-2" /> Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {company.status !== "active" && (
                                                                <DropdownMenuItem
                                                                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                                    onClick={() => openAction(company as Company, "activate")}
                                                                >
                                                                    <ShieldCheck className="h-4 w-4 mr-2" /> Set Active
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                                                onClick={() => openAction(company as Company, "block")}
                                                            >
                                                                <ShieldOff className="h-4 w-4 mr-2" /> Block Account
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                onClick={() => openAction(company as Company, "delete")}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── ACTIVATE DIALOG ── */}
            <Dialog open={actionType === "activate"} onOpenChange={closeAction}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-700">
                            <ShieldCheck className="h-5 w-5" /> Activate Company
                        </DialogTitle>
                        <DialogDescription>
                            This will set <strong>{selectedCompany?.name}</strong>'s account to <strong>Active</strong> and grant full platform access.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeAction}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleActivate}
                            disabled={!!actionLoading}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Confirm Activate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── BLOCK DIALOG ── */}
            <Dialog open={actionType === "block"} onOpenChange={closeAction}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <ShieldOff className="h-5 w-5" /> Block Account
                        </DialogTitle>
                        <DialogDescription>
                            Block <strong>{selectedCompany?.name}</strong> from accessing the platform for a set number of days.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="block-days">Block Duration (days)</Label>
                            <div className="flex gap-2">
                                {["1", "3", "7", "14", "30"].map(d => (
                                    <Button
                                        key={d}
                                        type="button"
                                        variant={blockDays === d ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setBlockDays(d)}
                                        className={blockDays === d ? "bg-orange-500 hover:bg-orange-600" : ""}
                                    >
                                        {d}d
                                    </Button>
                                ))}
                                <Input
                                    id="block-days"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={blockDays}
                                    onChange={(e) => setBlockDays(e.target.value)}
                                    className="w-20"
                                    placeholder="Days"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Account will be blocked until:{" "}
                                <strong>
                                    {(() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() + (parseInt(blockDays) || 7));
                                        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                    })()}
                                </strong>
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeAction}>Cancel</Button>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={handleBlock}
                            disabled={!!actionLoading}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                            Block for {blockDays} day{parseInt(blockDays) !== 1 ? "s" : ""}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── PERMANENT DELETE DIALOG ── */}
            <Dialog open={actionType === "delete"} onOpenChange={closeAction}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Permanently Delete
                        </DialogTitle>
                        <DialogDescription>
                            This will <strong>permanently remove</strong> <strong>{selectedCompany?.name}</strong> and all their data. This action <strong>cannot be undone</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                        ⚠️ All data including orders, employees, and settings will be lost forever.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeAction}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handlePermanentDelete}
                            disabled={!!actionLoading}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Yes, Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── EDIT DIALOG ── */}
            <Dialog open={actionType === "edit"} onOpenChange={closeAction}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle><Edit className="inline h-4 w-4 mr-2" />Edit Company</DialogTitle>
                        <DialogDescription>Update company information and status</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Admin Name</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-business">Company Name</Label>
                            <Input
                                id="edit-business"
                                value={editFormData.businessName}
                                onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <select
                                id="edit-status"
                                value={editFormData.status}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeAction}>Cancel</Button>
                            <Button type="submit" disabled={!!actionLoading}>
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AddCompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}
