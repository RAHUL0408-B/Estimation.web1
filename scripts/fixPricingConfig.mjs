// Run this script once to add 'enabled: true' to all existing material grades and finish types
// Usage: node scripts/fixPricingConfig.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixPricingConfig(tenantId) {
    console.log(`Fixing pricing config for tenant: ${tenantId}`);

    const configRef = doc(db, 'pricing_configs', tenantId);
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
        console.log('Pricing config not found');
        return;
    }

    const config = configSnap.data();

    // Add enabled: true to all material grades that don't have it
    const updatedMaterialGrades = config.materialGrades.map(grade => ({
        ...grade,
        enabled: grade.enabled !== undefined ? grade.enabled : true
    }));

    // Add enabled: true to all finish types that don't have it
    const updatedFinishTypes = config.finishTypes.map(finish => ({
        ...finish,
        enabled: finish.enabled !== undefined ? finish.enabled : true
    }));

    // Update the config
    await setDoc(configRef, {
        ...config,
        materialGrades: updatedMaterialGrades,
        finishTypes: updatedFinishTypes
    });

    console.log('✅ Pricing config fixed!');
    console.log('Material Grades:', updatedMaterialGrades);
    console.log('Finish Types:', updatedFinishTypes);
}

// Replace with your tenant ID
const tenantId = 'amit-interiors';
fixPricingConfig(tenantId)
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
