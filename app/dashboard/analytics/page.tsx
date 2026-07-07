import { BarChart3, Brain, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <DashboardShell title="Reports" eyebrow="Sales intelligence">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <TrendingUp className="mb-5 h-8 w-8 text-[#0284c7]" />
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Daily, weekly, and monthly sales summaries will connect to Neon data in the next phase.</CardDescription>
        </Card>
        <Card>
          <BarChart3 className="mb-5 h-8 w-8 text-[#6f35f5]" />
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Rank products by quantity sold, revenue, profit, and low-stock demand.</CardDescription>
        </Card>
        <Card>
          <Brain className="mb-5 h-8 w-8 text-[#16a34a]" />
          <div className="mb-3"><Badge variant="green">Groq later</Badge></div>
          <CardTitle>AI Assistant</CardTitle>
          <CardDescription>Ask natural-language questions about sales, inventory, reorder timing, and slow-moving products.</CardDescription>
        </Card>
      </div>
    </DashboardShell>
  );
}
