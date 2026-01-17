import { string, z } from "zod"

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "PROF", "STUDENT"]).optional(),
})

export { createInvitationSchema }
