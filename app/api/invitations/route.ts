import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import dayjs from "dayjs"
import { requireSession } from "@/lib/auth"

import { createInvitationSchema } from "./schema"

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()

    const invitedBy = session.user.email!

    const body = await request.json()

    const validation = createInvitationSchema.safeParse(body)

    if (!validation.success)
      return NextResponse.json(validation.error.errors, { status: 400 })

    const { email, role } = validation.data

    const expiresAt = dayjs().add(15, "day").toDate()

    const newInvitation = await prisma.invitation.create({
      data: { email, invitedBy, expiresAt, role: role || "PROFESSOR" },
    })

    return NextResponse.json(newInvitation, { status: 201 })
  } catch (err: any) {
    if (err?.message === "Not authenticated") {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(err.message)
      if (err.code === "P2002") {
        return NextResponse.json(
          { message: "An invitation with this email already exists" },
          { status: 409 }
        )
      }
    }
    console.error("[POST /api/invitations]", err)
    return NextResponse.json({ message: "Failed to create invitation" }, { status: 500 })
  }
}
