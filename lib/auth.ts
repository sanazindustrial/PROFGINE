import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const isLocalhost = process.env.NEXTAUTH_URL?.startsWith("http://localhost");

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],

    // CRITICAL: must be set, and must match proxy getToken secret
    secret: process.env.NEXTAUTH_SECRET,

    // Use secure cookies only in production
    useSecureCookies: !isLocalhost,

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    cookies: isLocalhost
        ? {
            sessionToken: {
                name: "next-auth.session-token",
                options: {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                    secure: false, // KEY: allow http localhost
                },
            },
            state: {
                name: "next-auth.state",
                options: {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                    secure: false,
                    maxAge: 900, // 15 minutes
                },
            },
            pkceCodeVerifier: {
                name: "next-auth.pkce.code_verifier",
                options: {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                    secure: false,
                    maxAge: 900, // 15 minutes
                },
            },
        }
        : undefined,
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
                token.subscriptionType = (user as any).subscriptionType;
                token.subscriptionExpiresAt = (user as any).subscriptionExpiresAt;
                token.trialExpiresAt = (user as any).trialExpiresAt;
                token.subscriptionStatus = (user as any).subscriptionStatus;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).subscriptionType = token.subscriptionType;
                (session.user as any).subscriptionExpiresAt = token.subscriptionExpiresAt as any;
                (session.user as any).trialExpiresAt = token.trialExpiresAt as any;
                (session.user as any).subscriptionStatus = token.subscriptionStatus;
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google' && user.email) {
                console.log("🔐 SignIn callback:", { user: user.email, account: account?.provider });

                // Check if user exists, if not create them
                let existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: {
                        userSubscription: {
                            select: {
                                status: true,
                                tier: true
                            }
                        }
                    }
                });

                if (!existingUser) {
                    console.log("👤 Creating new user:", user.email);

                    // Import the role determination function
                    const { determineRoleFromEmail } = await import("./user-management");

                    // Determine role based on email
                    const role = determineRoleFromEmail(user.email);

                    // Special case: Make first user admin
                    const userCount = await prisma.user.count();
                    const finalRole = userCount === 0 ? UserRole.ADMIN : role;

                    // Create user
                    existingUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || user.email.split('@')[0],
                            image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=0D8ABC&color=fff`,
                            role: finalRole
                        },
                        include: {
                            userSubscription: {
                                select: {
                                    status: true,
                                    tier: true
                                }
                            }
                        }
                    });

                    console.log(`✅ User ${user.email} assigned role: ${finalRole}`);

                    // Create individual subscription + usage
                    await prisma.userSubscription.create({
                        data: { userId: existingUser.id, tier: "FREE_TRIAL", status: "TRIALING" }
                    });

                    await prisma.userUsageCounter.create({
                        data: { userId: existingUser.id }
                    });
                }

                // Populate user object with database data for JWT callback
                (user as any).id = existingUser.id;
                (user as any).role = existingUser.role;
                (user as any).subscriptionType = existingUser.subscriptionType;
                (user as any).subscriptionExpiresAt = existingUser.subscriptionExpiresAt;
                (user as any).trialExpiresAt = existingUser.trialExpiresAt;
                (user as any).subscriptionStatus = existingUser.userSubscription?.status;

                console.log(`🎉 User signed in: ${user.email} via ${account.provider}`);
            }

            return true;
        },
        async redirect({ url, baseUrl }) {
            // Handle successful sign-in redirects
            if (url.startsWith("/auth/success") || url === baseUrl) {
                return `${baseUrl}/dashboard`;
            }
            // Allow relative callback URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            // Allow callback URLs on same origin
            else if (new URL(url).origin === baseUrl) {
                return url;
            }
            return baseUrl;
        },
    },
    debug: process.env.NODE_ENV === "development",
};

export async function requireSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("UNAUTHORIZED");
    return session;
}