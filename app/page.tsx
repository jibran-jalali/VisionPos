import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 md:px-8">
      <header className="flex items-center justify-between rounded-[32px] border border-[#dfebf3] bg-white/85 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-bold text-[#607080] hover:text-[#060b1f] sm:block">
            Login
          </Link>
          <Link href="/register">
            <Button variant="gradient">Start setup</Button>
          </Link>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center py-16 text-center lg:py-24">
        <div className="mx-auto max-w-5xl">
          <Badge variant="blue">AI-ready retail operating system</Badge>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#060b1f] md:text-7xl lg:text-8xl">
            Run your store
            <br />
            with <span className="vision-text-gradient">VisionPOS AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#607080]">
            VisionPOS runs entirely in your browser. Barcode scanning, visual product matching, inventory, invoices, roles, and printing — everything works directly from the cloud. No downloads, no setup.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" variant="gradient">
                View dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pos/checkout">
              <Button size="lg" variant="soft">Open checkout</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
