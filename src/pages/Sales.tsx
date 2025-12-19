import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdfUtils";

interface Sale {
  id: string;
  customer_name: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  notes: string | null;
  product_id: string | null;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    customer_name: "",
    quantity: "",
    unit_price: "",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [salesRes, productsRes] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, selling_price"),
      ]);

      if (salesRes.data) setSales(salesRes.data);
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

    const { error } = await supabase.from("sales").insert({
      product_id: formData.product_id || null,
      customer_name: formData.customer_name || null,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      sale_date: formData.sale_date,
      notes: formData.notes || null,
    });

    if (error) {
      toast.error("Failed to add sale");
      return;
    }

    toast.success("Sale recorded successfully");
    setShowModal(false);
    setFormData({
      product_id: "",
      customer_name: "",
      quantity: "",
      unit_price: "",
      sale_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    fetchData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete sale");
      return;
    }
    toast.success("Sale deleted");
    fetchData();
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      unit_price: product ? product.selling_price.toString() : "",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const handleGenerateInvoice = (sale: Sale) => {
    const product = products.find((p) => p.id === sale.product_id);
    const invoiceNumber = `INV-${sale.id.slice(0, 8).toUpperCase()}`;

    generateInvoicePDF({
      invoiceNumber,
      date: new Date(sale.sale_date).toLocaleDateString(),
      customerName: sale.customer_name || "Walk-in Customer",
      items: [
        {
          description: product?.name || sale.notes || "Product/Service",
          quantity: sale.quantity,
          unitPrice: sale.unit_price,
          total: sale.total_amount,
        },
      ],
      subtotal: sale.total_amount,
      total: sale.total_amount,
    });

    toast.success("Invoice generated successfully!");
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title font-heading">Sales</h1>
          <p className="page-description">Track your sales transactions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-success flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Record Sale
        </button>
      </div>

      <div className="stat-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No sales recorded yet
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="animate-fade-in">
                  <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td>{sale.customer_name || "-"}</td>
                  <td>{sale.quantity}</td>
                  <td>{formatCurrency(sale.unit_price)}</td>
                  <td className="font-medium text-success">{formatCurrency(sale.total_amount)}</td>
                  <td className="text-muted-foreground max-w-xs truncate">
                    {sale.notes || "-"}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleGenerateInvoice(sale)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Generate Invoice"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete"
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
            <h2 className="text-xl font-semibold mb-4">Record Sale</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product (Optional)</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.selling_price)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="input-field"
                  placeholder="Enter customer name"
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
                <label className="block text-sm font-medium mb-1">Sale Date</label>
                <input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
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
                <button type="submit" className="btn-success flex-1">
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
