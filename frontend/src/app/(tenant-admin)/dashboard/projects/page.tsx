"use client";

import { useState, useEffect } from "react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useOrders, Order } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    Hammer,
    Calendar,
    User,
    Phone,
    MapPin,
    ExternalLink,
    FileEdit,
    CheckCircle2,
    Clock,
    Plus,
    LayoutGrid,
    List,
    TrendingUp,
    MoreHorizontal,
    Briefcase,
    UserCircle,
    CalendarDays
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, onSnapshot } from "@/lib/firebaseWrapper";
import { useToast } from "@/hooks/use-toast";

interface Employee {
    id: string;
    name: string;
    area: string;
}

export default function ProjectsPage() {
    const { tenant } = useTenantAuth();
    const { orders, loading } = useOrders(tenant?.id || null);
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProject, setSelectedProject] = useState<Order | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Employees for assignment
    const [employees, setEmployees] = useState<Employee[]>([]);

    // Project Info Form
    const [requirements, setRequirements] = useState("");
    const [designNotes, setDesignNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Add Project Form
    const [newProject, setNewProject] = useState({
        name: "",
        phone: "",
        city: "",
        plan: "Standard",
        amount: "",
        requirements: "",
        startDate: new Date().toISOString().split('T')[0],
        assignedManager: "",
        assignedDesigner: "",
    });

    // Fetch employees for dropdowns
    useEffect(() => {
        if (!tenant?.id) return;
        const q = query(collection(db, "tenants", tenant.id, "employees"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                area: doc.data().area
            })) as Employee[];
            setEmployees(list);
        });
        return () => unsubscribe();
    }, [tenant?.id]);

    // Filter "Cracked" projects or projects with isProject=true
    const projects = orders.filter(o =>
        (o as any).isProject === true || o.status === 'cracked'
    );

    const filteredProjects = projects.filter(p =>
        (p.customerInfo?.name || p.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.customerInfo?.phone || p.clientPhone || "").includes(searchQuery) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenEdit = (project: Order) => {
        setSelectedProject(project);
        setRequirements((project as any).projectRequirements || "");
        setDesignNotes((project as any).designNotes || "");
        setIsEditOpen(true);
    };

    const handleSaveInfo = async () => {
        if (!selectedProject || !tenant?.id) return;
        setIsSaving(true);
        try {
            const projectRef = doc(db, `tenants/${tenant.id}/estimates`, selectedProject.id);
            await updateDoc(projectRef, {
                projectRequirements: requirements,
                designNotes: designNotes,
                lastUpdated: serverTimestamp()
            });
            toast({
                title: "Success",
                description: "Project information updated successfully.",
            });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Error saving project info:", error);
            toast({
                title: "Error",
                description: "Failed to update project information.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddProject = async () => {
        if (!tenant?.id) return;
        if (!newProject.name || !newProject.phone) {
            toast({
                title: "Required Fields",
                description: "Please enter at least the client name and phone.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const projectsRef = collection(db, `tenants/${tenant.id}/estimates`);
            await addDoc(projectsRef, {
                customerInfo: {
                    name: newProject.name,
                    phone: newProject.phone,
                    city: newProject.city,
                    email: "",
                },
                plan: newProject.plan,
                totalAmount: Number(newProject.amount) || 0,
                projectRequirements: newProject.requirements,
                startDate: newProject.startDate,
                assignedManager: newProject.assignedManager,
                assignedDesigner: newProject.assignedDesigner,
                status: 'cracked',
                isProject: true,
                convertedBy: 'Admin',
                createdAt: serverTimestamp(),
            });

            toast({
                title: "Project Added",
                description: "New active project has been created.",
            });
            setIsAddOpen(false);
            setNewProject({
                name: "",
                phone: "",
                city: "",
                plan: "Standard",
                amount: "",
                requirements: "",
                startDate: new Date().toISOString().split('T')[0],
                assignedManager: "",
                assignedDesigner: "",
            });
        } catch (error) {
            console.error("Error adding project:", error);
            toast({
                title: "Error",
                description: "Failed to create project.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Synchronizing project data...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                            <Hammer className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Operation Center</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Active Projects</h1>
                    <p className="text-gray-500 max-w-2xl">Streamline your workflow by managing construction sites and converted client projects in real-time.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all px-6 rounded-xl h-11"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Project
                    </Button>
                </div>
            </div>

            {/* Filters & Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500" />
                    <Input
                        placeholder="Search by client name, phone or ID..."
                        className="pl-12 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 text-lg rounded-xl shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-4">
                    <div className="bg-emerald-500 p-2 rounded-lg text-white">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase">Total Active</p>
                        <p className="text-xl font-bold text-emerald-900">{filteredProjects.length}</p>
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-4">
                    <div className="bg-blue-500 p-2 rounded-lg text-white">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase">In Progress</p>
                        <p className="text-xl font-bold text-blue-900">{filteredProjects.length}</p>
                    </div>
                </div>
            </div>

            {/* Projects List View */}
            {filteredProjects.length === 0 ? (
                <Card className="border-dashed border-2 bg-gray-50/50 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-emerald-100 p-6 rounded-3xl mb-4">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No projects found</h3>
                        <p className="text-gray-500 max-w-sm mt-2">
                            {searchQuery ? "Try adjusting your search terms." : "When an employee marks a lead as 'Cracked', it will automatically appear here."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredProjects.map((project) => (
                        <div key={project.id} className="group bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                {/* Status & Icon */}
                                <div className="hidden lg:flex flex-shrink-0 items-center justify-center w-14 h-14 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 transition-colors duration-300">
                                    <Hammer className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                                            ACTIVE PROJECT
                                        </Badge>
                                        <span className="text-xs font-medium text-gray-400">ID: #{project.id.slice(-6).toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 truncate">
                                        {project.customerInfo?.name || project.clientName || "Project"}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1.5 text-emerald-500" />
                                            {project.customerInfo?.city || "Location Pending"}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1.5 text-blue-500" />
                                            {(project as any).startDate || (project.createdAt ? (project.createdAt.toDate ? project.createdAt.toDate().toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()) : "Recently Added")}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-8 flex-shrink-0 lg:w-80 border-l border-gray-50 pl-6 hidden md:grid">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Management</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs font-medium text-gray-700">
                                                <UserCircle className="h-3 w-3 mr-1 text-blue-400" />
                                                {(project as any).assignedManager || "No Manager"}
                                            </div>
                                            <div className="flex items-center text-xs font-medium text-gray-700">
                                                <Briefcase className="h-3 w-3 mr-1 text-emerald-400" />
                                                {(project as any).assignedDesigner || "No Designer"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Value</p>
                                        <p className="text-sm font-bold text-emerald-700">₹{(project.totalAmount || project.estimatedAmount || 0).toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-gray-400">{project.plan || "Standard"} Plan</p>
                                    </div>
                                </div>

                                {/* Divider for mobile */}
                                <div className="h-px w-full bg-gray-100 lg:hidden"></div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Button
                                        onClick={() => handleOpenEdit(project)}
                                        className="flex-1 lg:flex-none bg-gray-900 hover:bg-black text-white px-5 rounded-xl h-11"
                                    >
                                        <FileEdit className="h-4 w-4 mr-2" />
                                        Project Info
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11 w-11 p-0 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                        onClick={() => project.pdfUrl && window.open(project.pdfUrl, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Project Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-2xl rounded-3xl pb-8 overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <Plus className="h-6 w-6 text-emerald-600" />
                            </div>
                            Create New Project
                        </DialogTitle>
                        <p className="text-muted-foreground pt-1">
                            Manually add a project to the active projects list.
                        </p>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-6">
                        {/* Section 1: Client Details */}
                        <div className="col-span-2 space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest pb-1 border-b">Client Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="c-name">Client Full Name</Label>
                                    <Input
                                        id="c-name"
                                        placeholder="Enter client's name"
                                        className="rounded-xl h-11 border-gray-200"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-phone">Phone Number</Label>
                                    <Input
                                        id="c-phone"
                                        placeholder="Contact number"
                                        className="rounded-xl h-11 border-gray-200"
                                        value={newProject.phone}
                                        onChange={(e) => setNewProject({ ...newProject, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-city">City/Location</Label>
                                    <Input
                                        id="c-city"
                                        placeholder="Project location"
                                        className="rounded-xl h-11 border-gray-200"
                                        value={newProject.city}
                                        onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Project Details */}
                        <div className="col-span-2 space-y-4 pt-2">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest pb-1 border-b">Project Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="c-plan">Plan Type</Label>
                                    <select
                                        id="c-plan"
                                        className="w-full h-11 rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        value={newProject.plan}
                                        onChange={(e) => setNewProject({ ...newProject, plan: e.target.value })}
                                    >
                                        <option value="Basic">Basic</option>
                                        <option value="Standard">Standard</option>
                                        <option value="Luxe">Luxe</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-amount">Project Budget (₹)</Label>
                                    <Input
                                        id="c-amount"
                                        type="number"
                                        placeholder="Estimated budget"
                                        className="rounded-xl h-11 border-gray-200"
                                        value={newProject.amount}
                                        onChange={(e) => setNewProject({ ...newProject, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-start">Start Date</Label>
                                    <Input
                                        id="c-start"
                                        type="date"
                                        className="rounded-xl h-11 border-gray-200"
                                        value={newProject.startDate}
                                        onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-manager">Assigned Manager</Label>
                                    <select
                                        id="c-manager"
                                        className="w-full h-11 rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        value={newProject.assignedManager}
                                        onChange={(e) => setNewProject({ ...newProject, assignedManager: e.target.value })}
                                    >
                                        <option value="">Select Manager</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-designer">Primary Designer</Label>
                                    <select
                                        id="c-designer"
                                        className="w-full h-11 rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        value={newProject.assignedDesigner}
                                        onChange={(e) => setNewProject({ ...newProject, assignedDesigner: e.target.value })}
                                    >
                                        <option value="">Select Designer</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2 pt-2">
                            <Label htmlFor="c-reqs">Initial Requirements</Label>
                            <Textarea
                                id="c-reqs"
                                placeholder="Enter brief project requirements..."
                                className="rounded-xl min-h-[100px] border-gray-200 p-4"
                                value={newProject.requirements}
                                onChange={(e) => setNewProject({ ...newProject, requirements: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                        <Button
                            onClick={handleAddProject}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 h-11 shadow-md hover:shadow-lg transition-all"
                            disabled={isSaving}
                        >
                            {isSaving ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Project Info Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <Hammer className="h-6 w-6 text-emerald-600" />
                            </div>
                            Update Information
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                            Refine details for <span className="font-bold text-gray-900">{selectedProject?.customerInfo?.name || selectedProject?.clientName}</span>
                        </p>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reqs" className="text-sm font-semibold text-gray-700">Client Requirements</Label>
                            <Textarea
                                id="reqs"
                                placeholder="Enter specific client requirements, material preferences, deadlines, etc..."
                                className="min-h-[120px] rounded-2xl border-gray-200 focus:ring-emerald-500 p-4 shadow-sm"
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-semibold text-blue-600">Interior Designer Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add specific design theme, color palette, or designer suggestions..."
                                className="min-h-[120px] rounded-2xl border-blue-100 focus:ring-blue-500 bg-blue-50/30 p-4 shadow-sm"
                                value={designNotes}
                                onChange={(e) => setDesignNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl h-11">Cancel</Button>
                        <Button
                            onClick={handleSaveInfo}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-11 shadow-md hover:shadow-lg transition-all"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
