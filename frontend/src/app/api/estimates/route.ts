import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // TODO: Add actual estimate processing logic
        return NextResponse.json({
            success: true,
            message: "Estimate saved successfully",
            id: "est_" + Date.now()
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Invalid request" },
            { status: 400 }
        );
    }
}
