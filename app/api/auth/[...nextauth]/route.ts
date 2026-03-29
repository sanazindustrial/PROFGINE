import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Auth environment validation (no secrets logged)
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("AUTH: Missing Google OAuth credentials");
}
if (!process.env.NEXTAUTH_SECRET) {
    console.warn("AUTH: Missing NEXTAUTH_SECRET");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
