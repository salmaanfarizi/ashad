import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Package,
  Users,
  CreditCard,
  Wallet,
  BarChart3,
  Camera,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Debtors", href: "/debtors", icon: Users },
  { name: "Creditors", href: "/creditors", icon: CreditCard },
  { name: "Cash", href: "/cash", icon: Wallet },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Camera", href: "/camera", icon: Camera },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            BizManager
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/50">
            © 2024 BizManager
          </p>
        </div>
      </div>
    </aside>
  );
}
