import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import * as tls from "tls";

interface CertInfo {
    domain: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    issuer: string;
    status: "valid" | "expiring" | "critical" | "expired" | "error";
    error?: string;
}

function checkSSLCert(hostname: string, port = 443): Promise<CertInfo> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({
                domain: hostname,
                validFrom: "",
                validTo: "",
                daysRemaining: -1,
                issuer: "",
                status: "error",
                error: "Connection timeout",
            });
        }, 10_000);

        try {
            const socket = tls.connect(
                { host: hostname, port, servername: hostname, rejectUnauthorized: false },
                () => {
                    clearTimeout(timeout);
                    const cert = socket.getPeerCertificate();
                    socket.end();

                    if (!cert || !cert.valid_to) {
                        resolve({
                            domain: hostname,
                            validFrom: "",
                            validTo: "",
                            daysRemaining: -1,
                            issuer: "",
                            status: "error",
                            error: "Could not retrieve certificate",
                        });
                        return;
                    }

                    const validTo = new Date(cert.valid_to);
                    const validFrom = new Date(cert.valid_from);
                    const now = new Date();
                    const daysRemaining = Math.floor(
                        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    let status: CertInfo["status"] = "valid";
                    if (daysRemaining <= 0) status = "expired";
                    else if (daysRemaining <= 7) status = "critical";
                    else if (daysRemaining <= 30) status = "expiring";

                    const issuerParts = [];
                    if (cert.issuer?.O) issuerParts.push(cert.issuer.O);
                    if (cert.issuer?.CN) issuerParts.push(cert.issuer.CN);

                    resolve({
                        domain: hostname,
                        validFrom: validFrom.toISOString(),
                        validTo: validTo.toISOString(),
                        daysRemaining,
                        issuer: issuerParts.join(" - ") || "Unknown",
                        status,
                    });
                }
            );

            socket.on("error", (err) => {
                clearTimeout(timeout);
                resolve({
                    domain: hostname,
                    validFrom: "",
                    validTo: "",
                    daysRemaining: -1,
                    issuer: "",
                    status: "error",
                    error: err.message,
                });
            });
        } catch (err: any) {
            clearTimeout(timeout);
            resolve({
                domain: hostname,
                validFrom: "",
                validTo: "",
                daysRemaining: -1,
                issuer: "",
                status: "error",
                error: err.message,
            });
        }
    });
}

// GET — Admin/owner can view SSL status
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, isOwner: true },
    });

    if (!user || (user.role !== UserRole.ADMIN && !user.isOwner)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const domain = process.env.SSL_CHECK_DOMAIN || "profgenie.ai";
    const cert = await checkSSLCert(domain);

    return NextResponse.json({
        ...cert,
        checkedAt: new Date().toISOString(),
        thresholds: { warning: 30, critical: 7 },
    });
}

// POST — Cron/webhook endpoint (secured by secret header)
// Usage: curl -X POST -H "x-cron-secret: <SECRET>" https://profgenie.ai/api/admin/ssl-check
export async function POST(req: Request) {
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // Allow admin session OR cron secret
    let authorized = false;

    if (expectedSecret && cronSecret === expectedSecret) {
        authorized = true;
    } else {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { role: true, isOwner: true },
            });
            if (user && (user.role === UserRole.ADMIN || user.isOwner)) {
                authorized = true;
            }
        }
    }

    if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domain = process.env.SSL_CHECK_DOMAIN || "profgenie.ai";
    const cert = await checkSSLCert(domain);

    // Notify owners if cert is expiring or critical
    if (cert.status === "expiring" || cert.status === "critical" || cert.status === "expired") {
        const owners = await prisma.user.findMany({
            where: { isOwner: true },
            select: { id: true, email: true, name: true },
        });

        // Create in-app notifications for all owners
        const notifications = owners.map((owner) => ({
            userId: owner.id,
            type: "SYSTEM_ANNOUNCEMENT" as const,
            title: cert.status === "expired"
                ? "⚠️ SSL Certificate EXPIRED"
                : cert.status === "critical"
                    ? `🚨 SSL Certificate expires in ${cert.daysRemaining} days`
                    : `⏰ SSL Certificate expires in ${cert.daysRemaining} days`,
            message: `The SSL certificate for ${domain} ${cert.status === "expired"
                ? "has expired"
                : `expires on ${new Date(cert.validTo).toLocaleDateString()}`
                }. Issued by: ${cert.issuer}. Please renew immediately to avoid service disruption.`,
            priority: cert.daysRemaining <= 7 ? "URGENT" as const : "HIGH" as const,
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }

        return NextResponse.json({
            ...cert,
            notified: true,
            ownersNotified: owners.map((o) => o.email),
            checkedAt: new Date().toISOString(),
        });
    }

    return NextResponse.json({
        ...cert,
        notified: false,
        checkedAt: new Date().toISOString(),
    });
}
