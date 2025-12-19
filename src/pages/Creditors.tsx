import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, CreditCard } from "lucide-react";
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

export default function Creditors() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState<Creditor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    amount_owed: "",
    due_date: "",
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalPayables = creditors.reduce((sum, c) => sum + Number(c.amount_owed), 0);

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
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
                  <td className="font-medium">{creditor.name}</td>
                  <td className="text-muted-foreground">
                    {creditor.phone || creditor.email || "-"}
                  </td>
                  <td className="font-medium text-destructive">
                    {formatCurrency(creditor.amount_owed)}
                  </td>
                  <td>
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
                  <td className="text-muted-foreground max-w-xs truncate">
                    {creditor.notes || "-"}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
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
                    type="number"
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
    </MainLayout>
  );
}
