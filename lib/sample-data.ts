export const sampleProducts = [
  { id: "1", name: "Mineral Water 500ml", sku: "WTR-500", price: 90, stock: 42, category: "Drinks", color: "#15BDF2" },
  { id: "2", name: "Classic Chips", sku: "CHP-001", price: 160, stock: 24, category: "Snacks", color: "#6F35F5" },
  { id: "3", name: "Chocolate Bar", sku: "CHO-120", price: 220, stock: 18, category: "Sweets", color: "#86EFAC" },
  { id: "4", name: "Cold Coffee", sku: "COF-250", price: 280, stock: 10, category: "Drinks", color: "#15BDF2" },
  { id: "5", name: "Noodles Pack", sku: "NDL-001", price: 130, stock: 34, category: "Grocery", color: "#F59E0B" },
  { id: "6", name: "Hand Wash", sku: "HYG-310", price: 390, stock: 8, category: "Household", color: "#EF4444" },
];

export const sampleSales = [
  { invoice: "VP-20260706-1142", cashier: "Ayan", amount: 1540, items: 8, time: "10:42 AM" },
  { invoice: "VP-20260706-1098", cashier: "Sara", amount: 920, items: 4, time: "09:55 AM" },
  { invoice: "VP-20260706-1031", cashier: "Ayan", amount: 2380, items: 11, time: "09:18 AM" },
];

export const dashboardMetrics = [
  { label: "Today's Revenue", value: "Rs 48,920", delta: "+12.8%", tone: "blue" },
  { label: "Sales Today", value: "126", delta: "+18 orders", tone: "green" },
  { label: "Low Stock", value: "9", delta: "Needs action", tone: "warning" },
  { label: "Active Products", value: "342", delta: "18 CV-ready", tone: "violet" },
] as const;
