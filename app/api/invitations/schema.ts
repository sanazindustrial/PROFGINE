import { z } from "zod"

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "PROFESSOR", "STUDENT"]).optional(),
})

export { createInvitationSchema }
