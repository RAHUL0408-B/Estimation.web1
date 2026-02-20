
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Manually parse .env.local
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length > 1) {
                const key = parts[0].trim();
                const loopVal = parts.slice(1).join('=').trim();
                // Remove quotes if present
                const val = loopVal.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
                process.env[key] = val;
            }
        });
    }
} catch (e) {
    console.log("Error reading .env.local", e);
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugAssignments() {
    try {
        // 1. Get Tenants
        const tenantsSnap = await getDocs(collection(db, "tenants"));
        if (tenantsSnap.empty) {
            console.log("No tenants found.");
            return;
        }

        const tenant = tenantsSnap.docs[0];
        const tenantId = tenant.id;
        console.log(`\n=== Analyzing Tenant: ${tenantId} ===`);

        // 2. Get Employees
        const employeesSnap = await getDocs(collection(db, "tenants", tenantId, "employees"));
        const employees = employeesSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
        console.log(`\nFound ${employees.length} Employees:`);
        employees.forEach(e => console.log(` - ID: "${e.id}", Name: "${e.name}"`));

        if (employees.length === 0) {
            console.log("No employees found for this tenant. Cannot check assignments.");
        }

        // 3. Get Estimates
        const estimatesSnap = await getDocs(collection(db, "tenants", tenantId, "estimates"));
        console.log(`\nFound ${estimatesSnap.size} Estimates:`);
        estimatesSnap.docs.forEach(d => {
            const data = d.data();
            const assignedTo = data.assignedTo;
            const assignedName = data.assignedToName;
            const match = employees.find(e => e.id === assignedTo);
            console.log(` - Estimate ID: ${d.id}`);
            console.log(`   Assigned To ID: "${assignedTo}" (${match ? "MATCH FOUND: " + match.name : "NO MATCH"})`);
            console.log(`   Assigned Name: ${assignedName}`);
        });

        // 4. Get Consultation Requests
        const requestsSnap = await getDocs(collection(db, "consultation_requests"));
        const tenantRequests = requestsSnap.docs.filter(d => d.data().tenantId === tenantId);
        console.log(`\nFound ${tenantRequests.length} Consultation Requests for Tenant:`);
        tenantRequests.forEach(d => {
            const data = d.data();
            const assignedTo = data.assignedTo;
            const match = employees.find(e => e.id === assignedTo);
            console.log(` - Request ID: ${d.id}`);
            console.log(`   Assigned To ID: "${assignedTo}" (${match ? "MATCH FOUND: " + match.name : "NO MATCH"})`);
        });

    } catch (error) {
        console.error("Error running debug:", error);
    }
}

debugAssignments();
