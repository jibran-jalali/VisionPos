import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cashierLoginAction } from "./actions";

export default async function CashierLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md p-8">
        <Logo className="mb-8" />
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#060b1f]">Cashier Login</h1>
          <p className="mt-2 text-sm leading-6 text-[#607080]">For checkout counters only. Cashier accounts are created by an admin.</p>
        </div>
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Invalid cashier email or password.
          </div>
        ) : null}
        <form action={cashierLoginAction} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Cashier email</label>
            <Input name="email" type="email" placeholder="cashier@store.com" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Password</label>
            <Input name="password" type="password" placeholder="Cashier password" required />
          </div>
          <Button className="w-full" size="lg" variant="gradient" type="submit">
            Open checkout
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#607080]">
          Admin or owner? <Link href="/login" className="font-bold text-[#0284c7]">Use admin login</Link>
        </p>
      </Card>
    </main>
  );
}
