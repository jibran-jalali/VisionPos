import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    include: { settings: true },
  });

  if (!business) {
    redirect("/login");
  }

  return (
    <DashboardShell title="Settings" eyebrow="Business configuration">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Real business profile created during owner registration.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            <Input placeholder="Business name" defaultValue={business.name} readOnly />
            <Input placeholder="Phone" defaultValue={business.phone || ""} readOnly />
            <Input placeholder="Address" defaultValue={business.address || ""} readOnly />
            <Button variant="gradient" disabled>Editing coming next</Button>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Invoice Preferences</CardTitle>
              <CardDescription>Stored per business. Receipt and A4 templates are ready.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            <Input defaultValue={`Default: ${business.settings?.defaultInvoiceFormat || "RECEIPT"}`} readOnly />
            <Input defaultValue={`Currency: ${business.settings?.currencyCode || "PKR"}`} readOnly />
            <Input defaultValue={business.settings?.invoiceFooter || "Thank you for shopping with us."} readOnly />
            <Button variant="primary" disabled>Editing coming next</Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
