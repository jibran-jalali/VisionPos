import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "VisionPOS — Browser POS for Retail Shops",
  description: "Run your shop from any browser. Barcode scanning, camera vision, inventory, receipts, and roles — no downloads, no setup. Start free.",
  icons: { icon: [{ url: "/favicon.png", sizes: "128x128", type: "image/png" }] },
  openGraph: {
    title: "VisionPOS — Browser POS for Retail Shops",
    description: "Scan barcodes, use camera vision, manage stock, print receipts. Works on any device. No downloads.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
