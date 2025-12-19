import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface Purchase {
  id: string;
  supplier_name: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  purchase_date: string;
  notes: string | null;
  product_id: string | null;
}

interface Product {
  id: string;
  name: string;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_name: "",
    quantity: "",
    unit_price: "",
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [purchasesRes, productsRes] = await Promise.all([
        supabase.from("purchases").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name"),
      ]);

      if (purchasesRes.data) setPurchases(purchasesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = parseInt(formData.quantity);
    const unitPrice = parseFloat(formData.unit_price);
    const totalAmount = quantity * unitPrice;

    const { error } = await supabase.from("purchases").insert({
      product_id: formData.product_id || null,
      supplier_name: formData.supplier_name || null,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      purchase_date: formData.purchase_date,
      notes: formData.notes || null,
    });

    if (error) {
      toast.error("Failed to add purchase");
      return;
    }

    toast.success("Purchase added successfully");
    setShowModal(false);
    setFormData({
      product_id: "",
      supplier_name: "",
      quantity: "",
      unit_price: "",
      purchase_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    fetchData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete purchase");
      return;
    }
    toast.success("Purchase deleted");
    fetchData();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title font-heading">Purchases</h1>
          <p className="page-description">Manage your purchase transactions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Purchase
        </button>
      </div>

      <div className="stat-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No purchases recorded yet
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="animate-fade-in">
                  <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                  <td>{purchase.supplier_name || "-"}</td>
                  <td>{purchase.quantity}</td>
                  <td>{formatCurrency(purchase.unit_price)}</td>
                  <td className="font-medium">{formatCurrency(purchase.total_amount)}</td>
                  <td className="text-muted-foreground max-w-xs truncate">
                    {purchase.notes || "-"}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(purchase.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-xl font-semibold mb-4">Add Purchase</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product (Optional)</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="input-field"
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
