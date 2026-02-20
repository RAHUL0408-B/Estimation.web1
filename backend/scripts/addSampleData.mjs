/**
 * Sample Data Script for Super Admin Dashboard
 * 
 * This script adds sample tenants and activities to Firestore for testing.
 * Run this once to populate your database with test data.
 * 
 * To run: node scripts/addSampleData.js
 * Or add it as a script in package.json
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addSampleData() {
    console.log("Adding sample data to Firestore...");

    // Sample Tenants
    const sampleTenants = [
        {
            name: "Rajesh Kumar",
            email: "rajesh@designs.com",
            phone: "+91 98765 43210",
            businessName: "Rajesh Interiors",
            storeId: "rajesh-interiors",
            status: "pending",
            createdAt: Timestamp.now(),
            subscription: {
                plan: "free",
                status: "active",
                startDate: Timestamp.now(),
            },
            revenue: {
                total: 0,
                lastMonth: 0,
                thisMonth: 0,
            },
        },
        {
            name: "Priya Sharma",
            email: "priya@interiors.com",
            phone: "+91 98765 43211",
            businessName: "Priya Interiors",
            storeId: "priya-interiors",
            status: "pending",
            createdAt: Timestamp.now(),
            subscription: {
                plan: "free",
                status: "active",
                startDate: Timestamp.now(),
            },
            revenue: {
                total: 0,
                lastMonth: 0,
                thisMonth: 0,
            },
        },
        {
            name: "Amit Patel",
            email: "amit@amitinteriors.com",
            phone: "+91 98765 43212",
            businessName: "Amit Interiors",
            storeId: "amit-interiors",
            status: "active",
            createdAt: Timestamp.fromDate(new Date("2024-01-15")),
            approvedAt: Timestamp.fromDate(new Date("2024-01-16")),
            activatedAt: Timestamp.fromDate(new Date("2024-01-20")),
            subscription: {
                plan: "pro",
                status: "active",
                startDate: Timestamp.fromDate(new Date("2024-01-20")),
            },
            revenue: {
                total: 125000,
                lastMonth: 45000,
                thisMonth: 65000,
            },
        },
        {
            name: "Sneha Reddy",
            email: "sneha@modernspaces.com",
            phone: "+91 98765 43213",
            businessName: "Modern Spaces",
            storeId: "modern-spaces",
            status: "active",
            createdAt: Timestamp.fromDate(new Date("2024-02-10")),
            approvedAt: Timestamp.fromDate(new Date("2024-02-11")),
            activatedAt: Timestamp.fromDate(new Date("2024-02-15")),
            subscription: {
                plan: "basic",
                status: "active",
                startDate: Timestamp.fromDate(new Date("2024-02-15")),
            },
            revenue: {
                total: 85000,
                lastMonth: 30000,
                thisMonth: 42000,
            },
        },
        {
            name: "Vikram Singh",
            email: "vikram@luxurydesigns.com",
            phone: "+91 98765 43214",
            businessName: "Luxury Designs",
            storeId: "luxury-designs",
            status: "active",
            createdAt: Timestamp.fromDate(new Date("2024-03-01")),
            approvedAt: Timestamp.fromDate(new Date("2024-03-02")),
            activatedAt: Timestamp.fromDate(new Date("2024-03-05")),
            subscription: {
                plan: "enterprise",
                status: "active",
                startDate: Timestamp.fromDate(new Date("2024-03-05")),
            },
            revenue: {
                total: 250000,
                lastMonth: 80000,
                thisMonth: 95000,
            },
        },
    ];

    // Add tenants
    for (const tenant of sampleTenants) {
        try {
            const docRef = await addDoc(collection(db, "tenants"), tenant);
            console.log(`✓ Added tenant: ${tenant.name} (${docRef.id})`);
        } catch (error) {
            console.error(`✗ Error adding tenant ${tenant.name}:`, error);
        }
    }

    // Sample Activities
    const sampleActivities = [
        {
            type: "signup",
            description: "New designer signup",
            createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        },
        {
            type: "store_activated",
            description: "Store activated",
            createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)), // 5 hours ago
        },
        {
            type: "payment",
            description: "Payment processed",
            createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
        },
        {
            type: "approval",
            description: "Tenant approved",
            createdAt: Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000)), // 2 days ago
        },
        {
            type: "signup",
            description: "New designer signup",
            createdAt: Timestamp.fromDate(new Date(Date.now() - 72 * 60 * 60 * 1000)), // 3 days ago
        },
    ];

    // Add activities
    for (const activity of sampleActivities) {
        try {
            const docRef = await addDoc(collection(db, "activities"), activity);
            console.log(`✓ Added activity: ${activity.description} (${docRef.id})`);
        } catch (error) {
            console.error(`✗ Error adding activity:`, error);
        }
    }

    console.log("\n✅ Sample data added successfully!");
    console.log("\nSummary:");
    console.log(`- ${sampleTenants.length} tenants added`);
    console.log(`- ${sampleActivities.length} activities added`);
    console.log("\nYou can now view the Super Admin dashboard to see real-time data!");
}

addSampleData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
