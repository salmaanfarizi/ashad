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
  Menu,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import mobtechLogo from "@/assets/mobtech-logo.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Customers", href: "/customers", icon: UserCircle },
  { name: "Debtors", href: "/debtors", icon: Users },
  { name: "Creditors", href: "/creditors", icon: CreditCard },
  { name: "Cash", href: "/cash", icon: Wallet },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Camera", href: "/camera", icon: Camera },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleLinkClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <img src={mobtechLogo} alt="MobTech" className="h-10 w-auto object-contain" />
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
                  onClick={handleLinkClick}
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
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </Button>
        <p className="text-xs text-sidebar-foreground/50">
          © 2024 MobTech
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-background shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
      <SidebarContent />
    </aside>
  );
}
