import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, Package } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  unit: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "pcs",
    quantity: "",
    cost_price: "",
    selling_price: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (data) setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const productData = {
      name: formData.name,
      sku: formData.sku || null,
      description: formData.description || null,
      unit: formData.unit,
      quantity: parseInt(formData.quantity) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Failed to update product");
        return;
      }
      toast.success("Product updated successfully");
    } else {
      const { error } = await supabase.from("products").insert(productData);

      if (error) {
        toast.error("Failed to add product");
        return;
      }
      toast.success("Product added successfully");
    }

    closeModal();
    fetchProducts();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete product");
      return;
    }
    toast.success("Product deleted");
    fetchProducts();
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      unit: product.unit,
      quantity: product.quantity.toString(),
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      description: "",
      unit: "pcs",
      quantity: "",
      cost_price: "",
      selling_price: "",
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.cost_price),
    0
  );

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title font-heading">Inventory</h1>
          <p className="page-description">Manage your products and stock</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="text-sm text-muted-foreground">Total Stock</p>
            <p className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="stat-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Value</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products in inventory
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="animate-fade-in">
                  <td>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="text-muted-foreground">{product.sku || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        product.quantity <= 0
                          ? "badge-danger"
                          : product.quantity < 10
                          ? "badge-warning"
                          : "badge-success"
                      }`}
                    >
                      {product.quantity} {product.unit}
                    </span>
                  </td>
                  <td>{formatCurrency(product.cost_price)}</td>
                  <td>{formatCurrency(product.selling_price)}</td>
                  <td className="font-medium">
                    {formatCurrency(product.quantity * Number(product.cost_price))}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field"
                    placeholder="SKU code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="ltr">Liters</option>
                    <option value="box">Boxes</option>
                    <option value="set">Sets</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="Product description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingProduct ? "Update" : "Add"} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
