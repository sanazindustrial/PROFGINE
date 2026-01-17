import { prisma } from "@/prisma/client"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/app/api/auth/auth-options"

class UserRepository {
  async getUser() {
    const session = await getServerSession(authOptions)

    const user = await prisma.user.findUnique({
      where: { email: session!.user!.email! },
    })
    return user
  }
}

export const userRepository = new UserRepository()
