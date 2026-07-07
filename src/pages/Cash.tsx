import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { toast } from "sonner";

interface CashTransaction {
  id: string;
  type: "in" | "out";
  amount: number;
  description: string | null;
  reference_type: string | null;
  transaction_date: string;
  created_at: string;
}

export default function Cash() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "in" as "in" | "out",
    amount: "",
    description: "",
    reference_type: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (data) setTransactions(data as CashTransaction[]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("cash_transactions").insert({
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description || null,
      reference_type: formData.reference_type || null,
      transaction_date: formData.transaction_date,
    });

    if (error) {
      toast.error("Failed to add transaction");
      return;
    }

    toast.success("Transaction added successfully");
    setShowModal(false);
    setFormData({
      type: "in",
      amount: "",
      description: "",
      reference_type: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    fetchTransactions();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("cash_transactions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete transaction");
      return;
    }
    toast.success("Transaction deleted");
    fetchTransactions();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const totalIn = transactions
    .filter((t) => t.type === "in")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = transactions
    .filter((t) => t.type === "out")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIn - totalOut;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title font-heading">Cash Management</h1>
          <p className="page-description">Track cash inflows and outflows</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="stat-card bg-success/5 border-success/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <ArrowUpRight className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cash In</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalIn)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <ArrowDownRight className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cash Out</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOut)}</p>
            </div>
          </div>
        </div>
        <div className={`stat-card ${balance >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${balance >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
              <Wallet className={`h-6 w-6 ${balance >= 0 ? "text-primary" : "text-destructive"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Reference</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No transactions recorded
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="animate-fade-in">
                  <td data-label="Date">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                  <td data-label="Type">
                    <span
                      className={`badge ${
                        transaction.type === "in" ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {transaction.type === "in" ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {transaction.type === "in" ? "Cash In" : "Cash Out"}
                    </span>
                  </td>
                  <td
                    data-label="Amount"
                    className={`font-medium ${
                      transaction.type === "in" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {transaction.type === "in" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td data-label="Description">{transaction.description || "-"}</td>
                  <td data-label="Reference" className="text-muted-foreground">{transaction.reference_type || "-"}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Transaction Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "in" })}
                    className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      formData.type === "in"
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Cash In
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "out" })}
                    className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      formData.type === "out"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    Cash Out
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input
                    type="number" inputMode="decimal"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="What is this transaction for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference Type</label>
                <select
                  value={formData.reference_type}
                  onChange={(e) => setFormData({ ...formData, reference_type: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="Sale">Sale</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Expense">Expense</option>
                  <option value="Debtor Payment">Debtor Payment</option>
                  <option value="Creditor Payment">Creditor Payment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${formData.type === "in" ? "btn-success" : "btn-danger"}`}
                >
                  Add {formData.type === "in" ? "Cash In" : "Cash Out"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
