import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { SubscriptionType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SUBSCRIPTION_CREDITS } from "@/lib/enhanced-subscription-manager-v2";
import { isAllowedUniversityEmail } from "@/lib/user-management";

const fallbackUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://profgenie.ai");

if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = fallbackUrl;
}

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
        CredentialsProvider({
            id: "credentials",
            name: "Admin Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.toLowerCase().trim();
                const password = credentials?.password;

                if (!email || !password) return null;
                if (!isAllowedUniversityEmail(email)) return null;

                const user: any = await (prisma.user as any).findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isOwner: true,
                        sessionVersion: true,
                        password: true,
                        image: true,
                        subscriptionType: true,
                        subscriptionExpiresAt: true,
                        trialExpiresAt: true,
                        userSubscription: { select: { status: true } },
                    },
                });

                if (!user || user.role !== UserRole.ADMIN) return null;
                if (!user.password) return null;

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isOwner: user.isOwner,
                    image: user.image,
                    subscriptionType: user.subscriptionType,
                    subscriptionExpiresAt: user.subscriptionExpiresAt,
                    trialExpiresAt: user.trialExpiresAt,
                    subscriptionStatus: user.userSubscription?.status,
                } as any;
            },
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
        : {
            sessionToken: {
                name: "__Secure-next-auth.session-token",
                options: {
                    httpOnly: true,
                    sameSite: "none",
                    path: "/",
                    secure: true,
                    domain: ".profgenie.ai",
                },
            },
            state: {
                name: "__Secure-next-auth.state",
                options: {
                    httpOnly: true,
                    sameSite: "none",
                    path: "/",
                    secure: true,
                    maxAge: 900,
                    domain: ".profgenie.ai",
                },
            },
            pkceCodeVerifier: {
                name: "__Secure-next-auth.pkce.code_verifier",
                options: {
                    httpOnly: true,
                    sameSite: "none",
                    path: "/",
                    secure: true,
                    maxAge: 900,
                    domain: ".profgenie.ai",
                },
            },
        },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
                token.isOwner = (user as any).isOwner;
                (token as any).sessionVersion = (user as any).sessionVersion ?? (token as any).sessionVersion;
                (token as any).invalidSession = false;
                token.subscriptionType = (user as any).subscriptionType;
                token.subscriptionExpiresAt = (user as any).subscriptionExpiresAt;
                token.trialExpiresAt = (user as any).trialExpiresAt;
                token.subscriptionStatus = (user as any).subscriptionStatus;
            }

            // Ensure role/owner data is present for existing sessions
            if (!token.role && token.email) {
                const dbUser: any = await (prisma.user as any).findUnique({
                    where: { email: token.email },
                    select: {
                        id: true,
                        role: true,
                        isOwner: true,
                        sessionVersion: true,
                        subscriptionType: true,
                        subscriptionExpiresAt: true,
                        trialExpiresAt: true,
                        userSubscription: {
                            select: { status: true }
                        }
                    },
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.isOwner = dbUser.isOwner;
                    token.sessionVersion = token.sessionVersion ?? dbUser.sessionVersion;
                    token.subscriptionType = dbUser.subscriptionType;
                    token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt as any;
                    token.trialExpiresAt = dbUser.trialExpiresAt as any;
                    token.subscriptionStatus = dbUser.userSubscription?.status;

                    if (token.sessionVersion !== dbUser.sessionVersion) {
                        (token as any).invalidSession = true;
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if ((token as any).invalidSession) {
                return null as any;
            }

            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).isOwner = (token as any).isOwner;
                (session.user as any).sessionVersion = (token as any).sessionVersion;
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

                if (!isAllowedUniversityEmail(user.email)) {
                    console.log("🚫 Sign-in blocked: non-university email", user.email);
                    return false;
                }

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

                const invitation = await prisma.invitation.findUnique({
                    where: { email: user.email },
                });

                const invitationValid =
                    !!invitation &&
                    invitation.status === "PENDING" &&
                    (!invitation.expiresAt || invitation.expiresAt > new Date());

                if (!existingUser) {
                    console.log("👤 Creating new user:", user.email);

                    // Import the role determination function
                    const { determineRoleFromEmail } = await import("./user-management");

                    // Determine role based on email
                    const role = invitationValid ? invitation!.role : determineRoleFromEmail(user.email);

                    if (role === UserRole.STUDENT) {
                        console.log("🚫 Sign-in blocked: student accounts are invite-only", user.email);
                        return false;
                    }

                    // Special case: Make first user admin
                    const userCount = await prisma.user.count();
                    const finalRole = userCount === 0 ? UserRole.ADMIN : role;

                    // Create user
                    const defaultCredits = SUBSCRIPTION_CREDITS[SubscriptionType.FREE];

                    existingUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name || user.email.split('@')[0],
                            image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=0D8ABC&color=fff`,
                            role: finalRole,
                            subscriptionType: SubscriptionType.FREE,
                            creditBalance: defaultCredits,
                            monthlyCredits: defaultCredits
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

                    if (invitationValid) {
                        await prisma.invitation.update({
                            where: { email: user.email },
                            data: { status: "ACCEPTED" },
                        });
                    }

                    // Create individual subscription + usage
                    await prisma.userSubscription.create({
                        data: { userId: existingUser.id, tier: "FREE_TRIAL", status: "TRIALING" }
                    });

                    await prisma.userUsageCounter.create({
                        data: { userId: existingUser.id }
                    });
                } else {
                    if (existingUser.role === UserRole.STUDENT) {
                        console.log("🚫 Sign-in blocked: student accounts are invite-only", user.email);
                        return false;
                    }

                    const { ensureUserSubscription } = await import("@/lib/access/getBillingContext");
                    await ensureUserSubscription(existingUser.id);

                    if (invitationValid && existingUser.role !== invitation!.role) {
                        existingUser = await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { role: invitation!.role },
                            include: {
                                userSubscription: {
                                    select: {
                                        status: true,
                                        tier: true,
                                    },
                                },
                            },
                        });

                        await prisma.invitation.update({
                            where: { email: user.email },
                            data: { status: "ACCEPTED" },
                        });
                    }

                    const nextName = user.name || existingUser.name || user.email.split('@')[0];
                    const nextImage = user.image || existingUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(nextName)}&background=0D8ABC&color=fff`;

                    if (nextName !== existingUser.name || nextImage !== existingUser.image) {
                        existingUser = await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: nextName,
                                image: nextImage
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
                    }

                    const updatedName = user.name || existingUser.name;
                    const updatedImage = user.image || existingUser.image;

                    if (updatedName !== existingUser.name || updatedImage !== existingUser.image) {
                        existingUser = await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: updatedName || existingUser.email.split("@")[0],
                                image: updatedImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName || existingUser.email)}&background=0D8ABC&color=fff`,
                            },
                            include: {
                                userSubscription: {
                                    select: {
                                        status: true,
                                        tier: true,
                                    },
                                },
                            },
                        });
                    }
                }

                // Populate user object with database data for JWT callback
                (user as any).id = existingUser.id;
                (user as any).role = existingUser.role;
                (user as any).isOwner = existingUser.isOwner;
                const bumpedSession: any = await (prisma.user as any).update({
                    where: { id: existingUser.id },
                    data: { sessionVersion: { increment: 1 } },
                    select: { sessionVersion: true },
                });

                (user as any).sessionVersion = bumpedSession.sessionVersion;
                (user as any).subscriptionType = existingUser.subscriptionType;
                (user as any).subscriptionExpiresAt = existingUser.subscriptionExpiresAt;
                (user as any).trialExpiresAt = existingUser.trialExpiresAt;
                (user as any).subscriptionStatus = existingUser.userSubscription?.status;

                console.log(`🎉 User signed in: ${user.email} via ${account.provider}`);
            }

            if (account?.provider === "credentials" && user?.email) {
                const dbUser: any = await (prisma.user as any).findUnique({
                    where: { email: user.email },
                    select: { id: true, sessionVersion: true },
                });

                if (dbUser) {
                    const bumpedSession: any = await (prisma.user as any).update({
                        where: { id: dbUser.id },
                        data: { sessionVersion: { increment: 1 } },
                        select: { sessionVersion: true },
                    });
                    (user as any).sessionVersion = bumpedSession.sessionVersion;
                }
            }

            return true;
        },
        async redirect({ url, baseUrl }) {
            // Handle successful sign-in redirects (role-based via proxy)
            if (url.startsWith("/auth/success") || url === baseUrl) {
                return `${baseUrl}/auth/success`;
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
    events: {
        async signIn(message) {
            console.log("NEXTAUTH_SIGNIN", message?.user?.email, message?.account?.provider);
        },
        async signOut(message) {
            console.log("NEXTAUTH_SIGNOUT", message?.token?.email);
        },
        async session(message) {
            console.log("NEXTAUTH_SESSION", message?.session?.user?.email);
        },
    },
    logger: {
        error(code, metadata) {
            console.error("NEXTAUTH_ERROR", code, metadata);
        },
    },
    debug: true,
};

export async function requireSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("UNAUTHORIZED");
    return session;
}