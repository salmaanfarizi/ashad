import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Download,
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
  PieChart as RechartPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { generateProfitLossReportPDF } from "@/lib/pdfUtils";
import { toast } from "sonner";

interface ReportData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  purchasesCount: number;
  expensesByCategory: { name: string; value: number }[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const DATE_RANGE_LABELS: { [key: string]: string } = {
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  all: "All Time",
};

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    salesCount: 0,
    purchasesCount: 0,
    expensesByCategory: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  async function fetchReportData() {
    try {
      const [sales, purchases, expenses] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("purchases").select("*"),
        supabase.from("expenses").select("*"),
      ]);

      const totalRevenue =
        sales.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalCost =
        purchases.data?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
      const totalExpenses =
        expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Group expenses by category
      const expenseMap: { [key: string]: number } = {};
      expenses.data?.forEach((e) => {
        expenseMap[e.category] = (expenseMap[e.category] || 0) + Number(e.amount);
      });
      const expensesByCategory = Object.entries(expenseMap).map(([name, value]) => ({
        name,
        value,
      }));

      setReportData({
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
        totalExpenses,
        netProfit: totalRevenue - totalCost - totalExpenses,
        salesCount: sales.data?.length || 0,
        purchasesCount: purchases.data?.length || 0,
        expensesByCategory,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
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

  const handleExportPDF = () => {
    generateProfitLossReportPDF(
      reportData.totalRevenue,
      reportData.totalCost,
      reportData.totalExpenses,
      reportData.grossProfit,
      reportData.netProfit,
      reportData.expensesByCategory,
      DATE_RANGE_LABELS[dateRange]
    );
    toast.success("Report exported successfully!");
  };

  const profitLossData = [
    { name: "Revenue", value: reportData.totalRevenue, fill: "hsl(var(--success))" },
    { name: "Cost", value: reportData.totalCost, fill: "hsl(var(--primary))" },
    { name: "Expenses", value: reportData.totalExpenses, fill: "hsl(var(--warning))" },
  ];

  return (
    <MainLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title font-heading">Reports & Analytics</h1>
          <p className="page-description">Analyze your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field w-40"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-success/5 border-success/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(reportData.totalRevenue)}</p>
          <p className="text-sm text-muted-foreground mt-1">{reportData.salesCount} sales</p>
        </div>
        <div className="stat-card bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Cost</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(reportData.totalCost)}</p>
          <p className="text-sm text-muted-foreground mt-1">{reportData.purchasesCount} purchases</p>
        </div>
        <div className="stat-card bg-warning/5 border-warning/20">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.totalExpenses)}</p>
        </div>
        <div
          className={`stat-card ${
            reportData.netProfit >= 0
              ? "bg-success/5 border-success/20"
              : "bg-destructive/5 border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <PieChart
              className={`h-5 w-5 ${
                reportData.netProfit >= 0 ? "text-success" : "text-destructive"
              }`}
            />
            <span className="text-sm font-medium text-muted-foreground">Net Profit</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              reportData.netProfit >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {formatCurrency(reportData.netProfit)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {reportData.totalRevenue > 0
              ? ((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1)
              : 0}
            % margin
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Cost vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitLossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {profitLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          {reportData.expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartPieChart>
                <Pie
                  data={reportData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </RechartPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {/* Profit & Loss Statement */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Profit & Loss Summary</h3>
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="font-medium">Total Revenue (Sales)</span>
            <span className="text-success font-semibold">{formatCurrency(reportData.totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="font-medium">Less: Cost of Goods (Purchases)</span>
            <span className="text-primary font-semibold">({formatCurrency(reportData.totalCost)})</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border bg-muted/50 px-3 rounded-lg">
            <span className="font-semibold">Gross Profit</span>
            <span className={`font-bold ${reportData.grossProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(reportData.grossProfit)}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="font-medium">Less: Operating Expenses</span>
            <span className="text-warning font-semibold">({formatCurrency(reportData.totalExpenses)})</span>
          </div>
          <div className="flex items-center justify-between py-4 bg-primary/5 px-4 rounded-lg">
            <span className="font-bold text-lg">Net Profit / (Loss)</span>
            <span className={`text-xl font-bold ${reportData.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(reportData.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
