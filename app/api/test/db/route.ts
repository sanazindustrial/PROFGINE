import { NextRequest, NextResponse } from "next/server";
import { testDatabaseConnection, getAllUsers, testRoleAssignment } from "@/lib/test-db";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated (optional, for security)
        const session = await requireSession();

        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action") || "connection";

        switch (action) {
            case "connection":
                const connectionResult = await testDatabaseConnection();
                return NextResponse.json(connectionResult);

            case "users":
                const usersResult = await getAllUsers();
                return NextResponse.json(usersResult);

            case "role":
                const email = searchParams.get("email");
                if (!email) {
                    return NextResponse.json({
                        success: false,
                        error: "Email parameter required"
                    }, { status: 400 });
                }
                const roleResult = await testRoleAssignment(email);
                return NextResponse.json({ success: true, data: roleResult });

            default:
                return NextResponse.json({
                    success: false,
                    error: "Invalid action. Use: connection, users, or role"
                }, { status: 400 });
        }
    } catch (error) {
        console.error("Database test API error:", error);

        // If it's an authentication error, return unauthorized
        if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
            return NextResponse.json({
                success: false,
                error: "Authentication required"
            }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error"
        }, { status: 500 });
    }
}