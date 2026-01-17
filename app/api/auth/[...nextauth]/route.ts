import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("AUTH ENV", {
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    googleIdEndsWith: process.env.GOOGLE_CLIENT_ID?.slice(-20),
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    secretStartsWith: process.env.GOOGLE_CLIENT_SECRET?.slice(0, 6),
    nextauthUrl: process.env.NEXTAUTH_URL,
});

console.log("NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);

console.log("ENV CHECK", {
    nextauthUrl: process.env.NEXTAUTH_URL,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    secretLen: process.env.NEXTAUTH_SECRET?.length,
});

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
