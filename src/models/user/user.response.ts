
import { UserStatus } from "@constants/user.enum"
import z from "zod"

const loginResponse = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    id: z.number(),
    name: z.string(),
    email: z.string(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]),
    phoneNumber: z.string(),
    roleId: z.number(),
    avatar: z.string(),
})
export type ILoginResponse = z.infer<typeof loginResponse>
//----------------------End----------------------//