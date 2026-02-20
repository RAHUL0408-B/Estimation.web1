import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        cities: [
            { id: "mumbai", name: "Mumbai", labourRate: 850, multiplier: 1.2 },
            { id: "delhi", name: "Delhi", labourRate: 750, multiplier: 1.1 },
            { id: "bangalore", name: "Bangalore", labourRate: 800, multiplier: 1.15 },
            { id: "pune", name: "Pune", labourRate: 700, multiplier: 1.0 },
        ],
        rooms: [
            { id: "living-standard", name: "Living Room", quality: "Standard", baseRate: 150000 },
            { id: "living-premium", name: "Living Room", quality: "Premium", baseRate: 250000 },
            { id: "kitchen-standard", name: "Kitchen", quality: "Standard", baseRate: 120000 },
            { id: "kitchen-premium", name: "Kitchen", quality: "Premium", baseRate: 200000 },
            { id: "bedroom-standard", name: "Bedroom", quality: "Standard", baseRate: 100000 },
            { id: "bedroom-premium", name: "Bedroom", quality: "Premium", baseRate: 180000 },
        ],
        materials: [
            { id: "plywood-standard", name: "Commercial Plywood", multiplier: 1.0 },
            { id: "plywood-premium", name: "BWP Grade Plywood", multiplier: 1.4 },
            { id: "hdhmr", name: "HDHMR", multiplier: 1.2 },
        ],
        finishes: [
            { id: "laminate-matte", name: "Laminate (Matte)", multiplier: 1.0 },
            { id: "laminate-gloss", name: "Laminate (High Gloss)", multiplier: 1.15 },
            { id: "acrylic", name: "Acrylic", multiplier: 1.5 },
            { id: "pu", name: "PU Paint", multiplier: 1.8 },
        ]
    });
}
