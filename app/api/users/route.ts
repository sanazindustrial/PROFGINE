import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { UserRole } from "@prisma/client";
import { assignUserRole, getAllUsers, getUsersByRole } from "@/lib/user-management";

// GET - List all users (Admin only)
export async function GET(request: Request) {
    try {
        // Only admins can view all users
        await requireRole([UserRole.ADMIN]);

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') as UserRole;

        let users;
        if (role && Object.values(UserRole).includes(role)) {
            users = await getUsersByRole(role);
        } else {
            users = await getAllUsers();
        }

        return NextResponse.json({
            users,
            count: users.length,
            filters: { role: role || 'all' }
        });

    } catch (error: any) {
        console.error('Error in GET /api/users:', error);

        if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update user role (Admin only)
export async function PUT(request: Request) {
    try {
        // Only admins can update user roles
        await requireRole([UserRole.ADMIN]);

        const body = await request.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'userId and role are required' },
                { status: 400 }
            );
        }

        if (!Object.values(UserRole).includes(role)) {
            return NextResponse.json(
                { error: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` },
                { status: 400 }
            );
        }

        const updatedUser = await assignUserRole(userId, role);

        return NextResponse.json({
            message: 'User role updated successfully',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error in PUT /api/users:', error);

        if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}