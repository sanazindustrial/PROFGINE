import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const inviteAdminSchema = z.object({
    email: z.string().email(),
    inviterName: z.string().min(1),
    message: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Only existing admins can invite new admins
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Only administrators can invite new admins" },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { email, inviterName, message } = inviteAdminSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            )
        }

        // Check if invitation already exists
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                email,
                status: "PENDING"
            }
        })

        if (existingInvitation) {
            return NextResponse.json(
                { error: "Active invitation already exists for this email" },
                { status: 400 }
            )
        }

        // Create admin invitation
        const invitation = await prisma.invitation.create({
            data: {
                email,
                role: "ADMIN",
                status: "PENDING",
                invitedBy: session.user.email!,
            }
        })

        // TODO: Send invitation email to the new admin
        // For now, just return success

        return NextResponse.json({
            message: "Admin invitation created successfully",
            invitationId: invitation.id
        })

    } catch (error) {
        console.error("Admin invitation error:", error)
        return NextResponse.json(
            { error: "Failed to send admin invitation" },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Only admins can view invitations
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const invitations = await prisma.invitation.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ invitations })
    } catch (error) {
        console.error("Failed to fetch invitations:", error)
        return NextResponse.json(
            { error: "Failed to fetch invitations" },
            { status: 500 }
        )
    }
}