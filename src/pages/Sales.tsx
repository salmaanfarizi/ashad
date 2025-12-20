import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, FileText, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdfUtils";
import { formatCurrency } from "@/lib/currency";

interface Sale {
  id: string;
  customer_name: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  notes: string | null;
  product_id: string | null;
  payment_status: string;
  customer_id: string | null;
}

interface Product {
  id: string;
  name: string;
  selling_price: number | null;
}

interface Customer {
  id: string;
  name: string;
  source: "customer" | "debtor";
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [formData, setFormData] = useState({
    product_id: "",
    customer_id: "",
    customer_name: "",
    quantity: "",
    unit_price: "",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
    payment_status: "paid" as "paid" | "credit",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [salesRes, productsRes, customersRes, debtorsRes] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, selling_price"),
        supabase.from("customers").select("id, name"),
        supabase.from("debtors").select("id, name"),
      ]);

      if (salesRes.data) setSales(salesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      
      // Combine customers and debtors, removing duplicates by name
      const allCustomers: Customer[] = [];
      const seenNames = new Set<string>();
      
      if (customersRes.data) {
        customersRes.data.forEach((c) => {
          if (!seenNames.has(c.name.toLowerCase())) {
            seenNames.add(c.name.toLowerCase());
            allCustomers.push({ ...c, source: "customer" });
          }
        });
      }
      
      if (debtorsRes.data) {
        debtorsRes.data.forEach((d) => {
          if (!seenNames.has(d.name.toLowerCase())) {
            seenNames.add(d.name.toLowerCase());
            allCustomers.push({ ...d, source: "debtor" });
          }
        });
      }
      
      setCustomers(allCustomers);
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

    // Get customer name
    let customerName = formData.customer_name;
    if (formData.customer_id) {
      const customer = customers.find((c) => c.id === formData.customer_id);
      if (customer) customerName = customer.name;
    }

    const { data: saleData, error } = await supabase.from("sales").insert({
      product_id: formData.product_id || null,
      customer_id: formData.customer_id || null,
      customer_name: customerName || null,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      sale_date: formData.sale_date,
      notes: formData.notes || null,
      payment_status: formData.payment_status,
    }).select().single();

    if (error) {
      toast.error("Failed to add sale");
      return;
    }

    // If credit sale, create debtor entry
    if (formData.payment_status === "credit" && customerName) {
      // Check if debtor already exists
      const { data: existingDebtor } = await supabase
        .from("debtors")
        .select("*")
        .eq("name", customerName)
        .maybeSingle();

      if (existingDebtor) {
        // Update existing debtor's amount
        await supabase
          .from("debtors")
          .update({ amount_owed: existingDebtor.amount_owed + totalAmount })
          .eq("id", existingDebtor.id);
      } else {
        // Create new debtor
        await supabase.from("debtors").insert({
          name: customerName,
          amount_owed: totalAmount,
          phone: formData.customer_id ? 
            customers.find(c => c.id === formData.customer_id)?.name : null,
          notes: `Credit sale - ${formData.notes || "No notes"}`,
        });
      }
      toast.success("Credit sale recorded - Added to debtors");
    } else {
      toast.success("Sale recorded successfully");
    }

    setShowModal(false);
    setFormData({
      product_id: "",
      customer_id: "",
      customer_name: "",
      quantity: "",
      unit_price: "",
      sale_date: new Date().toISOString().split("T")[0],
      notes: "",
      payment_status: "paid",
    });
    fetchData();
  }

  async function handleQuickAddCustomer() {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const { data, error } = await supabase.from("customers").insert({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || null,
    }).select().single();

    if (error) {
      toast.error("Failed to add customer");
      return;
    }

    toast.success("Customer added!");
    setShowAddCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    
    // Add to customers list and select
    setCustomers([...customers, { id: data.id, name: data.name, source: "customer" }]);
    setFormData({ ...formData, customer_id: data.id, customer_name: data.name });
  }

  async function handleQuickAddProduct() {
    if (!newProductName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const sellingPrice = parseFloat(newProductPrice) || 0;

    const { data, error } = await supabase.from("products").insert({
      name: newProductName.trim(),
      selling_price: sellingPrice,
      quantity: 0,
    }).select().single();

    if (error) {
      toast.error("Failed to add product");
      return;
    }

    toast.success("Product added!");
    setShowAddProduct(false);
    setNewProductName("");
    setNewProductPrice("");
    
    // Add to products list and select
    setProducts([...products, { id: data.id, name: data.name, selling_price: data.selling_price }]);
    setFormData({ ...formData, product_id: data.id, unit_price: sellingPrice.toString() });
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
      unit_price: product?.selling_price ? product.selling_price.toString() : "",
    });
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.name || "",
    });
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
              <th>Status</th>
              <th>Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
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
                  <td>
                    <span className={`badge-${sale.payment_status === 'paid' ? 'success' : 'warning'}`}>
                      {sale.payment_status === 'paid' ? 'Paid' : 'Credit'}
                    </span>
                  </td>
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
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Record Sale</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Product (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add New
                  </button>
                </div>
                
                {showAddProduct ? (
                  <div className="p-3 bg-muted rounded-lg space-y-2 mb-2">
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Product name *"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Selling price"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddProduct(false);
                          setNewProductName("");
                          setNewProductPrice("");
                        }}
                        className="btn-secondary text-xs py-1 px-2 flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddProduct}
                        className="btn-primary text-xs py-1 px-2 flex-1"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formData.product_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.selling_price || 0)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Customer</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" />
                    Add New
                  </button>
                </div>
                
                {showAddCustomer ? (
                  <div className="p-3 bg-muted rounded-lg space-y-2 mb-2">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Customer name *"
                    />
                    <input
                      type="tel"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Phone (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCustomer(false);
                          setNewCustomerName("");
                          setNewCustomerPhone("");
                        }}
                        className="btn-secondary text-xs py-1 px-2 flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddCustomer}
                        className="btn-primary text-xs py-1 px-2 flex-1"
                      >
                        Add Customer
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select existing customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Or enter name manually</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value, customer_id: "" })}
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
                <label className="block text-sm font-medium mb-1">Payment Status *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_status"
                      value="paid"
                      checked={formData.payment_status === "paid"}
                      onChange={() => setFormData({ ...formData, payment_status: "paid" })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Paid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_status"
                      value="credit"
                      checked={formData.payment_status === "credit"}
                      onChange={() => setFormData({ ...formData, payment_status: "credit" })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Credit (Add to Debtors)</span>
                  </label>
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
