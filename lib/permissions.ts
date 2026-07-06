export const roles = ["OWNER", "ADMIN", "MANAGER", "CASHIER"] as const;

export type Role = (typeof roles)[number];

const roleRank: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  CASHIER: 1,
};

export function hasRole(userRole: Role, minimumRole: Role) {
  return roleRank[userRole] >= roleRank[minimumRole];
}

export function canManageUsers(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageSettings(role: Role) {
  return role === "OWNER";
}

export function canManageInventory(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "MANAGER";
}
