import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  notes: string | null;
}

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Marketing",
  "Office Supplies",
  "Transportation",
  "Maintenance",
  "Insurance",
  "Taxes",
  "Other",
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("expenses").insert({
      category: formData.category,
      description: formData.description || null,
      amount: parseFloat(formData.amount),
      expense_date: formData.expense_date,
      notes: formData.notes || null,
    });

    if (error) {
      toast.error("Failed to add expense");
      return;
    }

    toast.success("Expense added successfully");
    setShowModal(false);
    setFormData({
      category: "",
      description: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    fetchExpenses();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete expense");
      return;
    }
    toast.success("Expense deleted");
    fetchExpenses();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <MainLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title font-heading">Expenses</h1>
          <p className="page-description">Track your business expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="stat-card mb-6 bg-warning/5 border-warning/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <p className="text-3xl font-bold text-warning">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
          </div>
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No expenses recorded yet
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="animate-fade-in">
                  <td data-label="Date">{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td data-label="Category">
                    <span className="badge bg-warning/10 text-warning">
                      {expense.category}
                    </span>
                  </td>
                  <td data-label="Description">{expense.description || "-"}</td>
                  <td data-label="Amount" className="font-medium text-warning">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td data-label="Notes" className="text-muted-foreground max-w-xs truncate">
                    {expense.notes || "-"}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(expense.id)}
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
            <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="What was this expense for?"
                />
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
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
