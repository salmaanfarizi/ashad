import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, Users, Mail, CreditCard, History, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { generatePaymentReceiptPDF } from "@/lib/pdfUtils";

interface Debtor {
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
  debtor_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export default function Debtors() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
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
    fetchDebtors();
  }, []);

  async function fetchDebtors() {
    try {
      const { data, error } = await supabase
        .from("debtors")
        .select("*")
        .order("amount_owed", { ascending: false });

      if (data) setDebtors(data);
    } catch (error) {
      console.error("Error fetching debtors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments(debtorId: string) {
    const { data, error } = await supabase
      .from("debtor_payments")
      .select("*")
      .eq("debtor_id", debtorId)
      .order("payment_date", { ascending: false });

    if (data) setPayments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const debtorData = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      amount_owed: parseFloat(formData.amount_owed) || 0,
      due_date: formData.due_date || null,
      notes: formData.notes || null,
    };

    if (editingDebtor) {
      const { error } = await supabase
        .from("debtors")
        .update(debtorData)
        .eq("id", editingDebtor.id);

      if (error) {
        toast.error("Failed to update debtor");
        return;
      }
      toast.success("Debtor updated successfully");
    } else {
      const { error } = await supabase.from("debtors").insert(debtorData);

      if (error) {
        toast.error("Failed to add debtor");
        return;
      }
      toast.success("Debtor added successfully");
    }

    closeModal();
    fetchDebtors();
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDebtor) return;

    const paymentAmount = parseFloat(paymentData.amount);
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    const { error: paymentError } = await supabase.from("debtor_payments").insert({
      debtor_id: selectedDebtor.id,
      amount: paymentAmount,
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      notes: paymentData.notes || null,
    });

    if (paymentError) {
      toast.error("Failed to record payment");
      return;
    }

    // Update debtor's amount owed
    const newAmountOwed = Math.max(0, selectedDebtor.amount_owed - paymentAmount);
    const { error: updateError } = await supabase
      .from("debtors")
      .update({ amount_owed: newAmountOwed })
      .eq("id", selectedDebtor.id);

    if (updateError) {
      toast.error("Failed to update balance");
      return;
    }

    // Add cash transaction (cash in) for the payment
    const { error: cashError } = await supabase.from("cash_transactions").insert({
      type: "in",
      amount: paymentAmount,
      description: `Payment from debtor: ${selectedDebtor.name}`,
      reference_type: "Debtor Payment",
      transaction_date: paymentData.payment_date,
    });

    if (cashError) {
      console.error("Failed to add cash transaction:", cashError);
    }

    toast.success(`Payment of ${formatCurrency(paymentAmount)} recorded`);
    closePaymentModal();
    fetchDebtors();
  }

  async function handleSendReminder(debtor: Debtor) {
    if (!debtor.email) {
      toast.error("No email address for this debtor");
      return;
    }

    setSendingReminder(debtor.id);

    try {
      const { data, error } = await supabase.functions.invoke("send-reminder", {
        body: {
          debtor_id: debtor.id,
          debtor_name: debtor.name,
          debtor_email: debtor.email,
          amount_owed: debtor.amount_owed,
          due_date: debtor.due_date,
        },
      });

      if (error) throw error;

      toast.success(`Reminder sent to ${debtor.email}`);
    } catch (error: any) {
      console.error("Failed to send reminder:", error);
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("debtors").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete debtor");
      return;
    }
    toast.success("Debtor deleted");
    fetchDebtors();
  }

  function openEditModal(debtor: Debtor) {
    setEditingDebtor(debtor);
    setFormData({
      name: debtor.name,
      phone: debtor.phone || "",
      email: debtor.email || "",
      amount_owed: debtor.amount_owed.toString(),
      due_date: debtor.due_date || "",
      notes: debtor.notes || "",
    });
    setShowModal(true);
  }

  function openPaymentModal(debtor: Debtor) {
    setSelectedDebtor(debtor);
    setPaymentData({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      notes: "",
    });
    setShowPaymentModal(true);
  }

  async function openHistoryModal(debtor: Debtor) {
    setSelectedDebtor(debtor);
    await fetchPayments(debtor.id);
    setShowHistoryModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingDebtor(null);
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
    setSelectedDebtor(null);
    setPaymentData({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      notes: "",
    });
  }

  function closeHistoryModal() {
    setShowHistoryModal(false);
    setSelectedDebtor(null);
    setPayments([]);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const totalReceivables = debtors.reduce((sum, d) => sum + Number(d.amount_owed), 0);

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <MainLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title font-heading">Debtors</h1>
          <p className="page-description">People who owe you money</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Debtor
        </button>
      </div>

      {/* Summary Card */}
      <div className="stat-card mb-6 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Receivables</p>
              <p className="text-2xl md:text-3xl font-bold text-primary">{formatCurrency(totalReceivables)}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground shrink-0">
            {debtors.length} debtor{debtors.length !== 1 ? "s" : ""}
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
            {debtors.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No debtors recorded
                </td>
              </tr>
            ) : (
              debtors.map((debtor) => (
                <tr key={debtor.id} className="animate-fade-in">
                  <td data-label="Name" className="font-medium">{debtor.name}</td>
                  <td data-label="Contact" className="text-muted-foreground">
                    {debtor.phone || debtor.email || "-"}
                  </td>
                  <td data-label="Amount Owed" className="font-medium text-primary">
                    {formatCurrency(debtor.amount_owed)}
                  </td>
                  <td data-label="Due Date">
                    {debtor.due_date ? (
                      <span
                        className={`badge ${
                          isOverdue(debtor.due_date) ? "badge-danger" : "badge-success"
                        }`}
                      >
                        {new Date(debtor.due_date).toLocaleDateString()}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td data-label="Notes" className="text-muted-foreground max-w-xs truncate">
                    {debtor.notes || "-"}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPaymentModal(debtor)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Record Payment"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openHistoryModal(debtor)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Payment History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSendReminder(debtor)}
                        disabled={!debtor.email || sendingReminder === debtor.id}
                        className={`p-2 rounded-lg transition-colors ${
                          debtor.email
                            ? "text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                            : "text-muted-foreground/50 cursor-not-allowed"
                        }`}
                        title={debtor.email ? "Send Email Reminder" : "No email address"}
                      >
                        <Mail className={`h-4 w-4 ${sendingReminder === debtor.id ? "animate-pulse" : ""}`} />
                      </button>
                      <button
                        onClick={() => openEditModal(debtor)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(debtor.id)}
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

      {/* Add/Edit Debtor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingDebtor ? "Edit Debtor" : "Add Debtor"}
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
                  placeholder="Debtor name"
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
                  {editingDebtor ? "Update" : "Add"} Debtor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Record Payment</h2>
              <button onClick={closePaymentModal} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground">Recording payment for</p>
              <p className="font-semibold">{selectedDebtor.name}</p>
              <p className="text-sm text-primary">
                Current balance: {formatCurrency(selectedDebtor.amount_owed)}
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
                  max={selectedDebtor.amount_owed}
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
      {showHistoryModal && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Payment History</h2>
              <button onClick={closeHistoryModal} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="font-semibold">{selectedDebtor.name}</p>
              <p className="text-sm text-primary">
                Current balance: {formatCurrency(selectedDebtor.amount_owed)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={payment.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => {
                              // Calculate balances for the receipt
                              const previousPayments = payments
                                .slice(0, index)
                                .reduce((sum, p) => sum + p.amount, 0);
                              const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                              const originalBalance = selectedDebtor!.amount_owed + totalPaid;
                              const balanceAfterThisPayment = originalBalance - previousPayments - payment.amount;
                              const balanceBeforeThisPayment = balanceAfterThisPayment + payment.amount;

                              generatePaymentReceiptPDF({
                                receiptNumber: payment.id.slice(0, 8).toUpperCase(),
                                paymentDate: new Date(payment.payment_date).toLocaleDateString(),
                                payerName: selectedDebtor!.name,
                                payerEmail: selectedDebtor!.email,
                                payerPhone: selectedDebtor!.phone,
                                amount: payment.amount,
                                paymentMethod: payment.payment_method || "cash",
                                previousBalance: balanceBeforeThisPayment,
                                newBalance: balanceAfterThisPayment,
                                notes: payment.notes,
                              });
                              toast.success("Receipt downloaded");
                            }}
                            className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Download Receipt"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
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
