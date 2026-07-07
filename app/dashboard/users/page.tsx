"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StoreAssignment = {
  id: string;
  storeId: string;
  role: string;
  store: { id: string; name: string; code: string };
};

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  storeUsers: StoreAssignment[];
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user: UserData) {
    setEditingId(user.id);
    setEditForm({ name: user.name || "", email: user.email, role: user.role });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", email: "", role: "" });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      fetchUsers();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string) {
    await fetch(`/api/users/${id}/toggle-active`, { method: "POST" });
    fetchUsers();
  }

  return (
    <DashboardShell title="Users" eyebrow="Roles and subaccounts">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Team Access</CardTitle>
            <CardDescription>Manage your team members and their roles.</CardDescription>
          </div>
        </CardHeader>
        {loading ? (
          <div className="rounded-3xl border border-dashed border-[#dfebf3] p-8 text-center text-sm font-medium text-[#607080]">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#dfebf3] p-8 text-center text-sm font-medium text-[#607080]">No users found.</div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#dfebf3]">
            <table className="w-full border-collapse bg-white text-left text-sm">
              <thead className="bg-[#f1f7fb] text-xs uppercase tracking-[0.16em] text-[#607080]">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Store</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfebf3]">
                {users.map((user) => (
                  <tr key={user.id} className={user.isActive ? "" : "bg-[#fafbfc]"}>
                    <td className="px-5 py-4 font-semibold text-[#060b1f]">
                      {editingId === user.id ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-9 text-sm"
                        />
                      ) : (
                        user.name || "Unnamed user"
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#607080]">
                      {editingId === user.id ? (
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="h-9 text-sm"
                          type="email"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {editingId === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="h-9 rounded-lg border border-[#dfebf3] bg-white px-3 text-sm font-semibold text-[#060b1f] focus:outline-none focus:ring-2 focus:ring-[#15BDF2]"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="CASHIER">CASHIER</option>
                        </select>
                      ) : (
                        <Badge variant={user.role === "OWNER" ? "dark" : user.role === "CASHIER" ? "green" : "blue"}>{user.role}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#607080]">
                      {user.storeUsers.length > 0
                        ? user.storeUsers.map((su) => su.store.name).join(", ")
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={user.isActive ? "green" : "neutral"}>
                        {user.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {editingId === user.id ? (
                          <>
                            <Button
                              variant="gradient"
                              className="h-8 px-3 text-xs"
                              onClick={() => saveEdit(user.id)}
                              disabled={saving}
                            >
                              {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              variant="soft"
                              className="h-8 px-3 text-xs"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              className="rounded-lg p-1.5 text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]"
                              title="Edit user"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(user.id)}
                              className="rounded-lg p-1.5 text-[#607080] transition hover:bg-[#f1f7fb] hover:text-[#060b1f]"
                              title={user.isActive ? "Deactivate user" : "Activate user"}
                            >
                              {user.isActive ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
