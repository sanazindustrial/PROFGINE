"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface UserWithSubscription {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  registeredAt: Date;
  subscription: {
    type: string;
    status: string;
    trialExpiresAt: Date | null;
  } | null;
}

export default function DebugUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUsers();
    } else if (status !== "loading") {
      setLoading(false);
      setError("Please sign in to view users");
    }
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">Debug: Users</h1>
        <div className="rounded-md border p-4">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">Debug: Users</h1>
        <div className="rounded-md border bg-yellow-50 p-4">
          <p>Please sign in to view user data.</p>
          <a href="/auth/signin" className="text-blue-600 hover:underline">
            Sign in here
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Debug: Users in Database</h1>
      
      {/* Current Session Info */}
      <div className="mb-6 rounded-md border bg-blue-50 p-4">
        <h2 className="mb-2 text-lg font-semibold">Current Session</h2>
        <pre className="overflow-auto text-sm">
          {JSON.stringify({
            user: session.user,
            expires: session.expires
          }, null, 2)}
        </pre>
      </div>

      {/* Users List */}
      <div className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">All Users ({users.length})</h2>
        
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-md border bg-gray-50 p-4">
            <p>No users found in database.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="rounded-md border bg-white p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Name:</strong> {user.name || "N/A"}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> 
                      <span className={`ml-2 rounded px-2 py-1 text-xs ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </p>
                    <p><strong>Registered:</strong> {new Date(user.registeredAt).toLocaleString()}</p>
                  </div>
                  <div>
                    {user.subscription ? (
                      <div>
                        <p><strong>Subscription:</strong> {user.subscription.type}</p>
                        <p><strong>Status:</strong> 
                          <span className={`ml-2 rounded px-2 py-1 text-xs ${
                            user.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            user.subscription.status === 'TRIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription.status}
                          </span>
                        </p>
                        {user.subscription.trialExpiresAt && (
                          <p><strong>Trial Expires:</strong> {new Date(user.subscription.trialExpiresAt).toLocaleString()}</p>
                        )}
                      </div>
                    ) : (
                      <p><strong>Subscription:</strong> None</p>
                    )}
                  </div>
                </div>
                {user.image && (
                  <div className="mt-2">
                    <div className="size-12 overflow-hidden rounded-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={user.image} 
                        alt={`${user.name}'s avatar`} 
                        className="size-12 rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-md border border-green-200 bg-green-50 p-4">
        <h2 className="mb-2 text-lg font-semibold">Testing Instructions</h2>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>Sign out and sign in again to test user creation</li>
          <li>Check if your role is assigned correctly based on your email</li>
          <li>Verify that subscription is created with trial status</li>
          <li>Test with different email domains to see role assignment</li>
        </ul>
      </div>
    </div>
  );
}