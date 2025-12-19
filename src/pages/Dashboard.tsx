import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart,
  TrendingUp,
  Receipt,
  Package,
  Users,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardStats {
  totalPurchases: number;
  totalSales: number;
  totalExpenses: number;
  inventoryCount: number;
  totalDebtors: number;
  totalCreditors: number;
  cashBalance: number;
}

const mockChartData = [
  { name: "Jan", sales: 4000, purchases: 2400 },
  { name: "Feb", sales: 3000, purchases: 1398 },
  { name: "Mar", sales: 2000, purchases: 9800 },
  { name: "Apr", sales: 2780, purchases: 3908 },
  { name: "May", sales: 1890, purchases: 4800 },
  { name: "Jun", sales: 2390, purchases: 3800 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPurchases: 0,
    totalSales: 0,
    totalExpenses: 0,
    inventoryCount: 0,
    totalDebtors: 0,
    totalCreditors: 0,
    cashBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [purchases, sales, expenses, products, debtors, creditors, cashIn, cashOut] =
        await Promise.all([
          supabase.from("purchases").select("total_amount"),
          supabase.from("sales").select("total_amount"),
          supabase.from("expenses").select("amount"),
          supabase.from("products").select("quantity"),
          supabase.from("debtors").select("amount_owed"),
          supabase.from("creditors").select("amount_owed"),
          supabase.from("cash_transactions").select("amount").eq("type", "in"),
          supabase.from("cash_transactions").select("amount").eq("type", "out"),
        ]);

      const totalPurchases = purchases.data?.reduce(
        (sum, p) => sum + Number(p.total_amount),
        0
      ) || 0;
      const totalSales = sales.data?.reduce(
        (sum, s) => sum + Number(s.total_amount),
        0
      ) || 0;
      const totalExpenses = expenses.data?.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      ) || 0;
      const inventoryCount = products.data?.reduce(
        (sum, p) => sum + p.quantity,
        0
      ) || 0;
      const totalDebtors = debtors.data?.reduce(
        (sum, d) => sum + Number(d.amount_owed),
        0
      ) || 0;
      const totalCreditors = creditors.data?.reduce(
        (sum, c) => sum + Number(c.amount_owed),
        0
      ) || 0;
      const totalCashIn = cashIn.data?.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      ) || 0;
      const totalCashOut = cashOut.data?.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      ) || 0;

      setStats({
        totalPurchases,
        totalSales,
        totalExpenses,
        inventoryCount,
        totalDebtors,
        totalCreditors,
        cashBalance: totalCashIn - totalCashOut,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1 className="page-title font-heading">Dashboard</h1>
        <p className="page-description">
          Overview of your business performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Total Purchases"
          value={formatCurrency(stats.totalPurchases)}
          icon={ShoppingCart}
          variant="primary"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Cash Balance"
          value={formatCurrency(stats.cashBalance)}
          icon={Wallet}
          variant={stats.cashBalance >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Inventory Items"
          value={stats.inventoryCount.toLocaleString()}
          icon={Package}
        />
        <StatCard
          title="Total Receivables"
          value={formatCurrency(stats.totalDebtors)}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Total Payables"
          value={formatCurrency(stats.totalCreditors)}
          icon={CreditCard}
          variant="danger"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-4">Sales vs Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stackId="1"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success) / 0.2)"
              />
              <Area
                type="monotone"
                dataKey="purchases"
                stackId="2"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="sales" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="stat-card">
          <div className="text-center py-8 text-muted-foreground">
            <p>Start adding transactions to see your activity here</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
