import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/cashier/login");
  }

  return children;
}
