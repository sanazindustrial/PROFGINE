import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { SubscriptionStatus, SubscriptionTier, SubscriptionType, UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

async function requireOwnerAdmin() {
    const session = await requireSession();
    const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true, isOwner: true },
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN || !adminUser.isOwner) {
        return null;
    }

    return adminUser;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const adminUser = await requireOwnerAdmin();
    if (!adminUser) {
        return NextResponse.json({ error: "Owner admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await req.json();

    const updates: any = {};

    if (typeof body.name === "string") updates.name = body.name;
    if (typeof body.role === "string" && Object.values(UserRole).includes(body.role)) {
        updates.role = body.role as UserRole;
    }
    if (typeof body.isOwner === "boolean") updates.isOwner = body.isOwner;
    if (typeof body.subscriptionType === "string" && Object.values(SubscriptionType).includes(body.subscriptionType)) {
        updates.subscriptionType = body.subscriptionType as SubscriptionType;
    }
    if (typeof body.subscriptionExpiresAt === "string" || body.subscriptionExpiresAt === null) {
        updates.subscriptionExpiresAt = body.subscriptionExpiresAt ? new Date(body.subscriptionExpiresAt) : null;
    }
    if (typeof body.trialExpiresAt === "string" || body.trialExpiresAt === null) {
        updates.trialExpiresAt = body.trialExpiresAt ? new Date(body.trialExpiresAt) : null;
    }
    if (typeof body.creditBalance === "number") updates.creditBalance = body.creditBalance;
    if (typeof body.monthlyCredits === "number") updates.monthlyCredits = body.monthlyCredits;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isOwner: true,
            subscriptionType: true,
            subscriptionExpiresAt: true,
            trialExpiresAt: true,
            creditBalance: true,
            monthlyCredits: true,
        },
    });

    if (body.subscriptionTier || body.subscriptionStatus || body.currentPeriodEnd || body.currentPeriodEnd === null) {
        const tier = Object.values(SubscriptionTier).includes(body.subscriptionTier)
            ? (body.subscriptionTier as SubscriptionTier)
            : SubscriptionTier.FREE_TRIAL;
        const status = Object.values(SubscriptionStatus).includes(body.subscriptionStatus)
            ? (body.subscriptionStatus as SubscriptionStatus)
            : SubscriptionStatus.TRIALING;
        const currentPeriodEnd = body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null;

        await prisma.userSubscription.upsert({
            where: { userId },
            create: {
                user: { connect: { id: userId } },
                tier,
                status,
                currentPeriodEnd: currentPeriodEnd ?? undefined,
            },
            update: {
                tier,
                status,
                currentPeriodEnd: currentPeriodEnd ?? undefined,
            },
        });
    }

    return NextResponse.json({
        message: "User updated",
        user: updatedUser,
    });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const adminUser = await requireOwnerAdmin();
    if (!adminUser) {
        return NextResponse.json({ error: "Owner admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    if (adminUser.id === userId) {
        return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const courses = await tx.course.findMany({
                where: { instructorId: userId },
                select: { id: true },
            });
            const courseIds = courses.map((course) => course.id);

            if (courseIds.length > 0) {
                const discussionThreads = await tx.discussionThread.findMany({
                    where: { courseId: { in: courseIds } },
                    select: { id: true },
                });
                const discussionThreadIds = discussionThreads.map((thread) => thread.id);

                if (discussionThreadIds.length > 0) {
                    await tx.discussionPost.deleteMany({
                        where: { threadId: { in: discussionThreadIds } },
                    });
                }

                await tx.discussionThread.deleteMany({
                    where: { courseId: { in: courseIds } },
                });

                await tx.assignment.deleteMany({
                    where: { courseId: { in: courseIds } },
                });

                await tx.enrollment.deleteMany({
                    where: { courseId: { in: courseIds } },
                });

                await tx.presentation.deleteMany({
                    where: { courseId: { in: courseIds } },
                });

                await tx.module.deleteMany({
                    where: { courseId: { in: courseIds } },
                });

                await tx.course.deleteMany({
                    where: { instructorId: userId },
                });
            }

            const submissions = await tx.submission.findMany({
                where: { studentId: userId },
                select: { id: true },
            });
            const submissionIds = submissions.map((submission) => submission.id);

            if (submissionIds.length > 0) {
                await tx.grade.deleteMany({
                    where: { submissionId: { in: submissionIds } },
                });
            }

            await tx.grade.deleteMany({
                where: { graderId: userId },
            });

            await tx.gradingActivity.deleteMany({
                where: { userId },
            });

            await tx.submission.deleteMany({
                where: { studentId: userId },
            });

            await tx.discussionPost.deleteMany({
                where: { authorId: userId },
            });

            await tx.enrollment.deleteMany({
                where: { userId },
            });

            await tx.presentation.deleteMany({
                where: { userId },
            });

            await tx.subscriptionFeature.deleteMany({
                where: { userId },
            });

            await tx.creditTransaction.deleteMany({
                where: { userId },
            });

            await tx.organizationMember.deleteMany({
                where: { userId },
            });

            await tx.professorStyle.deleteMany({
                where: { professorId: userId },
            });

            await tx.professorProfile.deleteMany({
                where: { userId },
            });

            await tx.studentProfile.deleteMany({
                where: { userId },
            });

            await tx.userSubscription.deleteMany({
                where: { userId },
            });

            await tx.userUsageCounter.deleteMany({
                where: { userId },
            });

            await tx.subscription.deleteMany({
                where: { userId },
            });

            await tx.session.deleteMany({
                where: { userId },
            });

            await tx.account.deleteMany({
                where: { userId },
            });

            await tx.user.delete({ where: { id: userId } });
        });

        return NextResponse.json({ message: "User deleted" });
    } catch (error) {
        console.error("User deletion error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
