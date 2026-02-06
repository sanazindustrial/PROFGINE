"use client";

import { useState } from "react";
import { Badge, Button, Select, TextField } from "@radix-ui/themes";
import { SubscriptionStatus, SubscriptionTier, SubscriptionType, UserRole } from "@prisma/client";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isOwner: boolean;
  subscriptionType: SubscriptionType | null;
  subscriptionExpiresAt: string | null;
  trialExpiresAt: string | null;
  creditBalance: number;
  monthlyCredits: number;
  subscriptionTier: SubscriptionTier | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
};

const subscriptionTypes = ["FREE", "BASIC", "PREMIUM"] as const;
const subscriptionTiers = ["FREE_TRIAL", "BASIC", "PREMIUM", "ENTERPRISE"] as const;
const subscriptionStatuses = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "INCOMPLETE"] as const;
const roles = ["ADMIN", "PROFESSOR", "STUDENT"] as const;

interface OwnerUserManagementTableProps {
  initialUsers: UserRow[];
  currentUserId: string;
}

export function OwnerUserManagementTable({ initialUsers, currentUserId }: OwnerUserManagementTableProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const updateUser = async (userId: string, updates: Partial<UserRow> & {
    subscriptionTier?: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
    currentPeriodEnd?: string | null;
  }) => {
    setSavingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update user");
      }

      const result = await response.json();
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...result.user } : user)));
    } finally {
      setSavingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{user.name || "No name"}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              {user.isOwner && <Badge color="purple">Owner</Badge>}
              <Badge color={user.role === "ADMIN" ? "red" : user.role === "PROFESSOR" ? "blue" : "green"}>{user.role}</Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm">
              Role
              <Select.Root
                value={user.role}
                onValueChange={(value) =>
                  setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, role: value as UserRole } : row)))
                }
              >
                <Select.Trigger />
                <Select.Content>
                  {roles.map((role) => (
                    <Select.Item key={role} value={role}>
                      {role}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label className="text-sm">
              Subscription Type
              <Select.Root
                value={user.subscriptionType || "FREE"}
                onValueChange={(value) =>
                  setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, subscriptionType: value as SubscriptionType } : row)))
                }
              >
                <Select.Trigger />
                <Select.Content>
                  {subscriptionTypes.map((type) => (
                    <Select.Item key={type} value={type}>
                      {type}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label className="text-sm">
              Owner
              <Select.Root
                value={user.isOwner ? "true" : "false"}
                onValueChange={(value) =>
                  setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, isOwner: value === "true" } : row)))
                }
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="true">Owner</Select.Item>
                  <Select.Item value="false">Not Owner</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            <label className="text-sm">
              Subscription Tier
              <Select.Root
                value={user.subscriptionTier || "FREE_TRIAL"}
                onValueChange={(value) => {
                  setUsers((prev) =>
                    prev.map((row) => (row.id === user.id ? { ...row, subscriptionTier: value as SubscriptionTier } : row))
                  );
                }}
              >
                <Select.Trigger />
                <Select.Content>
                  {subscriptionTiers.map((tier) => (
                    <Select.Item key={tier} value={tier}>
                      {tier}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label className="text-sm">
              Subscription Status
              <Select.Root
                value={user.subscriptionStatus || "TRIALING"}
                onValueChange={(value) => {
                  setUsers((prev) =>
                    prev.map((row) => (row.id === user.id ? { ...row, subscriptionStatus: value as SubscriptionStatus } : row))
                  );
                }}
              >
                            <label className="text-sm">
                              Subscription Period End
                              <TextField.Root
                                type="date"
                                value={user.currentPeriodEnd ? user.currentPeriodEnd.slice(0, 10) : ""}
                                onChange={(event) =>
                                  setUsers((prev) =>
                                    prev.map((row) =>
                                      row.id === user.id
                                        ? { ...row, currentPeriodEnd: event.target.value ? new Date(event.target.value).toISOString() : null }
                                        : row
                                    )
                                  )
                                }
                              />
                            </label>
                <Select.Trigger />
                <Select.Content>
                  {subscriptionStatuses.map((status) => (
                    <Select.Item key={status} value={status}>
                      {status}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label className="text-sm">
              Subscription Expires
              <TextField.Root
                type="date"
                value={user.subscriptionExpiresAt ? user.subscriptionExpiresAt.slice(0, 10) : ""}
                onChange={(event) =>
                  setUsers((prev) =>
                    prev.map((row) =>
                      row.id === user.id
                        ? { ...row, subscriptionExpiresAt: event.target.value ? new Date(event.target.value).toISOString() : null }
                        : row
                    )
                  )
                }
              />
            </label>

            <label className="text-sm">
              Credit Balance
              <TextField.Root
                type="number"
                value={user.creditBalance.toString()}
                onChange={(event) =>
                  setUsers((prev) =>
                    prev.map((row) =>
                      row.id === user.id ? { ...row, creditBalance: Number(event.target.value) } : row
                    )
                  )
                }
              />
            </label>

            <label className="text-sm">
              Monthly Credits
              <TextField.Root
                type="number"
                value={user.monthlyCredits.toString()}
                onChange={(event) =>
                  setUsers((prev) =>
                    prev.map((row) =>
                      row.id === user.id ? { ...row, monthlyCredits: Number(event.target.value) } : row
                    )
                  )
                }
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              disabled={savingUserId === user.id}
              onClick={() =>
                updateUser(user.id, {
                  role: user.role,
                  isOwner: user.isOwner,
                  subscriptionType: user.subscriptionType || "FREE",
                  subscriptionExpiresAt: user.subscriptionExpiresAt,
                  trialExpiresAt: user.trialExpiresAt,
                  creditBalance: user.creditBalance,
                  monthlyCredits: user.monthlyCredits,
                  subscriptionTier: user.subscriptionTier || "FREE_TRIAL",
                  subscriptionStatus: user.subscriptionStatus || "TRIALING",
                  currentPeriodEnd: user.currentPeriodEnd,
                })
              }
            >
              {savingUserId === user.id ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              color="red"
              variant="soft"
              disabled={deletingUserId === user.id || user.id === currentUserId}
              onClick={() => deleteUser(user.id)}
            >
              {deletingUserId === user.id ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}