import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; registered?: string }> }) {
  const { error, registered } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md p-8">
        <Logo className="mb-8" />
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#060b1f]">Admin Login</h1>
          <p className="mt-2 text-sm leading-6 text-[#607080]">Access business settings, users, products, inventory, and reports.</p>
        </div>
        {registered ? (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Workspace created. Login with your owner account.
          </div>
        ) : null}
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Invalid email or password.
          </div>
        ) : null}
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Email</label>
            <Input name="email" type="email" placeholder="owner@store.com" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Password</label>
            <Input name="password" type="password" placeholder="Minimum 8 characters" required />
          </div>
          <Button className="w-full" size="lg" variant="gradient" type="submit">
            Continue
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#607080]">
          New business? <Link href="/register" className="font-bold text-[#0284c7]">Create owner account</Link>
        </p>
        <p className="mt-3 text-center text-sm text-[#607080]">
          Cashier counter? <Link href="/cashier/login" className="font-bold text-[#0284c7]">Use cashier login</Link>
        </p>
      </Card>
    </main>
  );
}
