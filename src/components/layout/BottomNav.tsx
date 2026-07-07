import { Link, useLocation, useNavigate } from "react-router-dom";
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
  LogOut,
  MoreHorizontal,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const mainTabs = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Debtors", href: "/debtors", icon: Users },
];

const moreItems = [
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Customers", href: "/customers", icon: UserCircle },
  { name: "Creditors", href: "/creditors", icon: CreditCard },
  { name: "Cash", href: "/cash", icon: Wallet },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Camera", href: "/camera", icon: Camera },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreItems.some((item) => item.href === location.pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
      active ? "text-primary font-medium" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {mainTabs.map((tab) => (
          <Link
            key={tab.name}
            to={tab.href}
            className={tabClass(location.pathname === tab.href)}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.name}</span>
          </Link>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className={tabClass(moreActive)}>
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="grid grid-cols-3 gap-2 pt-2">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary font-medium"
                        : "border-border/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-6 w-6" />
                <span>Log out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
