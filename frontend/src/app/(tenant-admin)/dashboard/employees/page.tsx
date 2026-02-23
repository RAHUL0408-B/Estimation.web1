
"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    query,
    onSnapshot,
    serverTimestamp,
    orderBy,
    doc,
    deleteDoc,
    updateDoc
} from "@/lib/firebaseWrapper";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
    id: string;
    name: string;
    email: string;
    password?: string; // Storing for demo simplicity; in prod use Firebase Auth
    area: string;
    phone: string;
    totalWork: number;
    currentWork: string;
    upcomingWork?: string;
    tenantId: string;
    createdAt?: any;
}

export default function EmployeesPage() {
    const { tenant, loading: authLoading } = useTenantAuth();
    const { toast } = useToast();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        area: "",
        phone: "",
        totalWork: 0,
        currentWork: "None",
        upcomingWork: "None"
    });

    useEffect(() => {
        if (!tenant?.id) return;

        const q = query(
            collection(db, "tenants", tenant.id, "employees"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const empList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Employee[];
            setEmployees(empList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching employees:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenant?.id]);

    const handleOpenDialog = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                name: employee.name,
                email: employee.email,
                password: employee.password || "",
                area: employee.area,
                phone: employee.phone,
                totalWork: employee.totalWork,
                currentWork: employee.currentWork,
                upcomingWork: employee.upcomingWork || "None"
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                name: "",
                email: "",
                password: "",
                area: "",
                phone: "",
                totalWork: 0,
                currentWork: "None",
                upcomingWork: "None"
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant?.id) return;

        try {
            if (editingEmployee) {
                // Update
                const empRef = doc(db, "tenants", tenant.id, "employees", editingEmployee.id);
                await updateDoc(empRef, {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
                toast({ title: "Success", description: "Employee updated successfully." });
            } else {
                // Add New
                await addDoc(collection(db, "tenants", tenant.id, "employees"), {
                    ...formData,
                    tenantId: tenant.id,
                    createdAt: serverTimestamp()
                });
                toast({ title: "Success", description: "Employee added successfully." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving employee:", error);
            toast({
                title: "Error",
                description: "Failed to save employee.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!tenant?.id || !confirm("Are you sure you want to delete this employee?")) return;

        try {
            await deleteDoc(doc(db, "tenants", tenant.id, "employees", id));
            toast({ title: "Deleted", description: "Employee removed successfully." });
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast({
                title: "Error",
                description: "Failed to delete employee.",
                variant: "destructive"
            });
        }
    };

    if (authLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and assign tasks.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-[#0F172A]">
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Area</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Total Work</TableHead>
                            <TableHead>Current Work</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No employees found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">
                                        <div>{employee.name}</div>
                                        <div className="text-xs text-gray-400">{employee.email}</div>
                                    </TableCell>
                                    <TableCell>{employee.area}</TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell>{employee.totalWork}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.currentWork !== "None"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {employee.currentWork}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(employee)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(employee.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="area">Area/Location</Label>
                                <Input
                                    id="area"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Login ID)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="text"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Set login password"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="totalWork">Total Works</Label>
                                <Input
                                    id="totalWork"
                                    type="number"
                                    value={formData.totalWork}
                                    onChange={(e) => setFormData({ ...formData, totalWork: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentWork">Current Work</Label>
                                <Input
                                    id="currentWork"
                                    value={formData.currentWork}
                                    onChange={(e) => setFormData({ ...formData, currentWork: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-[#0F172A]">
                                {editingEmployee ? "Update Employee" : "Add Employee"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
