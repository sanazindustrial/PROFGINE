"use client";

import React, { useMemo, useState } from "react";

type PaidTier = "BASIC" | "PREMIUM" | "ENTERPRISE";
type OwnerType = "USER" | "ORG";

export default function BillingClient(props: {
    user: { id: string; email: string; name: string; role: string };
    effective: { ownerType: OwnerType; ownerId: string; tier: string; status: string };
    orgs: Array<{
        orgId: string;
        orgName: string;
        orgRole: string;
        tier: string;
        status: string;
        stripeCustomerId: string | null;
    }>;
    userSubscription: { tier: string; status: string; stripeCustomerId: string | null };
}) {
    const [ownerType, setOwnerType] = useState<OwnerType>("USER");
    const [selectedOrgId, setSelectedOrgId] = useState<string>(
        props.orgs[0]?.orgId ?? ""
    );
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const hasOrgs = props.orgs.length > 0;

    const selectedOrg = useMemo(
        () => props.orgs.find((o) => o.orgId === selectedOrgId) ?? null,
        [props.orgs, selectedOrgId]
    );

    async function startCheckout(tier: PaidTier) {
        setError(null);
        setBusy(`checkout:${tier}`);
        try {
            const payload =
                ownerType === "USER"
                    ? { tier, ownerType }
                    : { tier, ownerType, orgId: selectedOrgId };

            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Checkout failed");
            if (!data?.url) throw new Error("Missing checkout URL");

            window.location.href = data.url;
        } catch (e: any) {
            setError(e?.message ?? "Checkout failed");
        } finally {
            setBusy(null);
        }
    }

    async function openPortal() {
        setError(null);
        setBusy("portal");
        try {
            const payload =
                ownerType === "USER"
                    ? { ownerType }
                    : { ownerType, orgId: selectedOrgId };

            const res = await fetch("/api/billing/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Portal failed");
            if (!data?.url) throw new Error("Missing portal URL");

            window.location.href = data.url;
        } catch (e: any) {
            setError(e?.message ?? "Portal failed");
        } finally {
            setBusy(null);
        }
    }

    const portalHint =
        ownerType === "USER"
            ? props.userSubscription.stripeCustomerId
                ? "Manage your personal subscription in Stripe."
                : "No personal Stripe customer yet. Upgrade first to create one."
            : selectedOrg?.stripeCustomerId
                ? "Manage the organization subscription in Stripe."
                : "No org Stripe customer yet. Upgrade first to create one.";

    const portalDisabled =
        ownerType === "USER"
            ? !props.userSubscription.stripeCustomerId
            : !selectedOrg?.stripeCustomerId;

    return (
        <div className="space-y-6">
            <div className="space-y-3 rounded-2xl border p-4">
                <div className="text-sm opacity-70">Choose billing type</div>

                <div className="flex flex-wrap gap-3">
                    <button
                        className={`rounded-xl border px-4 py-2${ownerType === "USER" ? " bg-black text-white" : ""}`}
                        onClick={() => setOwnerType("USER")}
                        type="button"
                    >
                        Personal (User)
                    </button>

                    <button
                        className={`rounded-xl border px-4 py-2${ownerType === "ORG" ? " bg-black text-white" : ""}`}
                        onClick={() => setOwnerType("ORG")}
                        type="button"
                        disabled={!hasOrgs}
                        title={!hasOrgs ? "You are not in any organizations yet" : ""}
                    >
                        Organization
                    </button>
                </div>

                {ownerType === "ORG" && (
                    <div className="space-y-2">
                        <div className="text-sm opacity-70">Select organization</div>
                        <select
                            className="w-full rounded-xl border px-3 py-2"
                            value={selectedOrgId}
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                            disabled={!hasOrgs}
                            title="Select organization"
                        >
                            {props.orgs.map((o) => (
                                <option key={o.orgId} value={o.orgId}>
                                    {o.orgName} — {o.tier} ({o.status})
                                </option>
                            ))}
                        </select>
                        {!hasOrgs && (
                            <div className="text-sm opacity-70">
                                You don&apos;t have an organization yet. Create one from your Org settings (or we can add a &quot;Create Org&quot; button here).
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
                <div className="text-sm opacity-70">Upgrade</div>
                <div className="grid gap-3 md:grid-cols-3">
                    <TierCard
                        title="Basic"
                        desc="Core modules + analytics"
                        onClick={() => startCheckout("BASIC")}
                        busy={busy === "checkout:BASIC"}
                    />
                    <TierCard
                        title="Premium"
                        desc="AI grading + custom rubrics"
                        onClick={() => startCheckout("PREMIUM")}
                        busy={busy === "checkout:PREMIUM"}
                    />
                    <TierCard
                        title="Enterprise"
                        desc="Bulk ops + advanced reporting"
                        onClick={() => startCheckout("ENTERPRISE")}
                        busy={busy === "checkout:ENTERPRISE"}
                    />
                </div>
            </div>

            <div className="space-y-2 rounded-2xl border p-4">
                <div className="text-sm opacity-70">Manage billing (Stripe Portal)</div>
                <div className="text-sm opacity-80">{portalHint}</div>
                <button
                    className="rounded-xl border px-4 py-2"
                    onClick={openPortal}
                    disabled={portalDisabled || busy === "portal"}
                    type="button"
                >
                    {busy === "portal" ? "Opening..." : "Manage billing"}
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-400 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="text-xs opacity-60">
                Note: Access enforcement must also be done server-side in API routes using{" "}
                <code className="rounded bg-gray-100 px-1">requireModule()</code>.
            </div>
        </div>
    );
}

function TierCard(props: {
    title: string;
    desc: string;
    onClick: () => void;
    busy?: boolean;
}) {
    return (
        <div className="space-y-2 rounded-2xl border p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            <div className="text-sm opacity-80">{props.desc}</div>
            <button
                className="w-full rounded-xl border px-4 py-2"
                onClick={props.onClick}
                disabled={props.busy}
                type="button"
            >
                {props.busy ? "Redirecting..." : `Upgrade to ${props.title}`}
            </button>
        </div>
    );
}