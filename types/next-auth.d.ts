import { DefaultSession } from "next-auth";
import { Role } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role;
      businessId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    businessId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    businessId?: string | null;
  }
}
