"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";

// Mock data for customers
const MOCK_CUSTOMERS = [
    {
        id: "CUST-001",
        name: "Alice Johnson",
        email: "alice@example.com",
        orders: 5,
        totalSpent: "$12,450",
        lastOrder: "2024-02-15",
        status: "Active"
    },
    {
        id: "CUST-002",
        name: "Bob Smith",
        email: "bob@example.com",
        orders: 2,
        totalSpent: "$5,200",
        lastOrder: "2024-01-20",
        status: "Active"
    },
    {
        id: "CUST-003",
        name: "Charlie Brown",
        email: "charlie@example.com",
        orders: 0,
        totalSpent: "$0",
        lastOrder: "N/A",
        status: "Inactive"
    },
    {
        id: "CUST-004",
        name: "Diana Prince",
        email: "diana@example.com",
        orders: 12,
        totalSpent: "$45,000",
        lastOrder: "2024-02-10",
        status: "VIP"
    }
];

export default function CustomersPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">Manage your customer base and view their activity.</p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search customers..." className="pl-8" />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>A list of all users who have signed up on your storefront.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Total Spent</TableHead>
                                <TableHead>Last Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_CUSTOMERS.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>{customer.orders}</TableCell>
                                    <TableCell>{customer.totalSpent}</TableCell>
                                    <TableCell>{customer.lastOrder}</TableCell>
                                    <TableCell>
                                        <Badge variant={customer.status === 'Active' ? 'default' : customer.status === 'VIP' ? 'secondary' : 'outline'}>
                                            {customer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
