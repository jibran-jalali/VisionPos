import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreLogoForm } from "@/components/settings/store-logo-form";
import { PrinterSettings } from "@/components/settings/printer-settings";
import { VisionToggle } from "@/components/settings/vision-toggle";
import { AutoPrintToggle } from "@/components/settings/auto-print-toggle";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";
import { InvoiceSettingsForm } from "@/components/settings/invoice-settings-form";
import { TaxSettingsForm } from "@/components/settings/tax-settings-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Eye, Printer, Receipt } from "lucide-react";

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
              <CardDescription>Update your business name, phone, and address.</CardDescription>
            </div>
          </CardHeader>
          <BusinessProfileForm
            initialName={business.name}
            initialPhone={business.phone || ""}
            initialAddress={business.address || ""}
          />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Store Logo</CardTitle>
              <CardDescription>Upload the logo that appears at the top of receipt and A4 invoices.</CardDescription>
            </div>
          </CardHeader>
          <StoreLogoForm initialLogoUrl={business.logoUrl} />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Invoice Preferences</CardTitle>
              <CardDescription>Configure invoice format, currency, and footer text.</CardDescription>
            </div>
          </CardHeader>
          <InvoiceSettingsForm
            initialFormat={business.settings?.defaultInvoiceFormat || "RECEIPT"}
            initialCurrencyCode={business.settings?.currencyCode || "PKR"}
            initialCurrencySymbol={business.settings?.currencySymbol || "Rs"}
            initialFooter={business.settings?.invoiceFooter || "Thank you for shopping with us."}
          />
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#6F35F5]" />
              <div>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Enable tax and set the default tax rate applied to sales.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <TaxSettingsForm
            initialEnabled={business.settings?.taxEnabled ?? false}
            initialRate={Number(business.settings?.taxRate ?? 0)}
          />
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#6F35F5]" />
              <div>
                <CardTitle>Vision System</CardTitle>
                <CardDescription>Enable or disable camera-based barcode + product scanning for cashiers.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            <VisionToggle initialEnabled={business.settings?.visionEnabled ?? true} />
            <p className="text-xs text-[#607080]">
              When OFF, cashiers will only see the product grid. Camera, barcode scan, vision matching, and OCR are all disabled.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-[#6F35F5]" />
              <div>
                <CardTitle>Receipt Printer</CardTitle>
                <CardDescription>Connect a USB thermal receipt printer (ESC/POS). Works in Chrome and Edge.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="grid gap-4">
            <PrinterSettings initialConnected={false} />
            <AutoPrintToggle initialEnabled={business.settings?.autoPrint ?? false} />
            <p className="text-xs text-[#607080]">
              Auto-print automatically prints a receipt after each sale. You can also print manually from the invoice popup.
            </p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
