import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, CreditCard, History, X, Banknote } from "lucide-react";
import { toast } from "sonner";

interface Creditor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  amount_owed: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  creditor_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export default function Creditors() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState<Creditor | null>(null);
  const [selectedCreditor, setSelectedCreditor] = useState<Creditor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    amount_owed: "",
    due_date: "",
    notes: "",
  });
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    notes: "",
  });

  useEffect(() => {
    fetchCreditors();
  }, []);

  async function fetchCreditors() {
    try {
      const { data, error } = await supabase
        .from("creditors")
        .select("*")
        .order("amount_owed", { ascending: false });

      if (data) setCreditors(data);
    } catch (error) {
      console.error("Error fetching creditors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments(creditorId: string) {
    const { data, error } = await supabase
      .from("creditor_payments")
      .select("*")
      .eq("creditor_id", creditorId)
      .order("payment_date", { ascending: false });

    if (data) setPayments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const creditorData = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      amount_owed: parseFloat(formData.amount_owed) || 0,
      due_date: formData.due_date || null,
      notes: formData.notes || null,
    };

    if (editingCreditor) {
      const { error } = await supabase
        .from("creditors")
        .update(creditorData)
        .eq("id", editingCreditor.id);

      if (error) {
        toast.error("Failed to update creditor");
        return;
      }
      toast.success("Creditor updated successfully");
    } else {
      const { error } = await supabase.from("creditors").insert(creditorData);

      if (error) {
        toast.error("Failed to add creditor");
        return;
      }
      toast.success("Creditor added successfully");
    }

    closeModal();
    fetchCreditors();
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCreditor) return;

    const paymentAmount = parseFloat(paymentData.amount);
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    const { error: paymentError } = await supabase.from("creditor_payments").insert({
      creditor_id: selectedCreditor.id,
      amount: paymentAmount,
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      notes: paymentData.notes || null,
    });

    if (paymentError) {
      toast.error("Failed to record payment");
      return;
    }

    // Update creditor's amount owed
    const newAmountOwed = Math.max(0, selectedCreditor.amount_owed - paymentAmount);
    const { error: updateError } = await supabase
      .from("creditors")
      .update({ amount_owed: newAmountOwed })
      .eq("id", selectedCreditor.id);

    if (updateError) {
      toast.error("Failed to update balance");
      return;
    }

    toast.success(`Payment of ${formatCurrency(paymentAmount)} recorded`);
    closePaymentModal();
    fetchCreditors();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("creditors").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete creditor");
      return;
    }
    toast.success("Creditor deleted");
    fetchCreditors();
  }

  function openEditModal(creditor: Creditor) {
    setEditingCreditor(creditor);
    setFormData({
      name: creditor.name,
      phone: creditor.phone || "",
      email: creditor.email || "",
      amount_owed: creditor.amount_owed.toString(),
      due_date: creditor.due_date || "",
      notes: creditor.notes || "",
    });
    setShowModal(true);
  }

  function openPaymentModal(creditor: Creditor) {
    setSelectedCreditor(creditor);
    setPaymentData({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      notes: "",
    });
    setShowPaymentModal(true);
  }

  async function openHistoryModal(creditor: Creditor) {
    setSelectedCreditor(creditor);
    await fetchPayments(creditor.id);
    setShowHistoryModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCreditor(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      amount_owed: "",
      due_date: "",
      notes: "",
    });
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedCreditor(null);
    setPaymentData({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      notes: "",
    });
  }

  function closeHistoryModal() {
    setShowHistoryModal(false);
    setSelectedCreditor(null);
    setPayments([]);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const totalPayables = creditors.reduce((sum, c) => sum + Number(c.amount_owed), 0);

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <MainLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title font-heading">Creditors</h1>
          <p className="page-description">People you owe money to</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Creditor
        </button>
      </div>

      {/* Summary Card */}
      <div className="stat-card mb-6 bg-destructive/5 border-destructive/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <CreditCard className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Payables</p>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalPayables)}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {creditors.length} creditor{creditors.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Amount Owed</th>
              <th>Due Date</th>
              <th>Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {creditors.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No creditors recorded
                </td>
              </tr>
            ) : (
              creditors.map((creditor) => (
                <tr key={creditor.id} className="animate-fade-in">
                  <td data-label="Name" className="font-medium">{creditor.name}</td>
                  <td data-label="Contact" className="text-muted-foreground">
                    {creditor.phone || creditor.email || "-"}
                  </td>
                  <td data-label="Amount Owed" className="font-medium text-destructive">
                    {formatCurrency(creditor.amount_owed)}
                  </td>
                  <td data-label="Due Date">
                    {creditor.due_date ? (
                      <span
                        className={`badge ${
                          isOverdue(creditor.due_date) ? "badge-danger" : "badge-success"
                        }`}
                      >
                        {new Date(creditor.due_date).toLocaleDateString()}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td data-label="Notes" className="text-muted-foreground max-w-xs truncate">
                    {creditor.notes || "-"}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPaymentModal(creditor)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Record Payment"
                      >
                        <Banknote className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openHistoryModal(creditor)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Payment History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(creditor)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(creditor.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Creditor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingCreditor ? "Edit Creditor" : "Add Creditor"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Creditor name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount Owed *</label>
                  <input
                    type="number" inputMode="decimal"
                    step="0.01"
                    value={formData.amount_owed}
                    onChange={(e) => setFormData({ ...formData, amount_owed: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingCreditor ? "Update" : "Add"} Creditor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedCreditor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Record Payment</h2>
              <button onClick={closePaymentModal} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground">Recording payment to</p>
              <p className="font-semibold">{selectedCreditor.name}</p>
              <p className="text-sm text-destructive">
                Current balance: {formatCurrency(selectedCreditor.amount_owed)}
              </p>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <input
                  type="number" inputMode="decimal"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="input-field"
                  required
                  min="0.01"
                  max={selectedCreditor.amount_owed}
                  placeholder="Payment amount"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    className="input-field"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="input-field"
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closePaymentModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedCreditor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Payment History</h2>
              <button onClick={closeHistoryModal} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="font-semibold">{selectedCreditor.name}</p>
              <p className="text-sm text-destructive">
                Current balance: {formatCurrency(selectedCreditor.amount_owed)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                          {payment.payment_method?.replace("_", " ") || "Cash"}
                        </span>
                        {payment.notes && (
                          <span className="text-xs text-muted-foreground">{payment.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 border-t mt-4">
              <button onClick={closeHistoryModal} className="btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
