import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerOwnerAction } from "./actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-2xl p-8">
        <Logo className="mb-8" />
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#060b1f]">Create your owner account</h1>
          <p className="mt-2 text-sm leading-6 text-[#607080]">The first account becomes OWNER. Cashiers will be created later by admins.</p>
        </div>
        {error ? (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error === "exists" ? "An account with this email already exists." : "Check the form and try again."}
          </div>
        ) : null}
        <form action={registerOwnerAction} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Owner name</label>
            <Input name="name" placeholder="Jibran Jalali" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Business name</label>
            <Input name="businessName" placeholder="Vision Mart" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Email</label>
            <Input name="email" type="email" placeholder="owner@store.com" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Password</label>
            <Input name="password" type="password" placeholder="Minimum 8 characters" required minLength={8} />
          </div>
          <Button className="md:col-span-2" size="lg" variant="gradient" type="submit">
            Create workspace
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#607080]">
          Already set up? <Link href="/login" className="font-bold text-[#0284c7]">Login</Link>
        </p>
      </Card>
    </main>
  );
}
