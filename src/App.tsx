import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import Inventory from "./pages/Inventory";
import Debtors from "./pages/Debtors";
import Creditors from "./pages/Creditors";
import Cash from "./pages/Cash";
import Reports from "./pages/Reports";
import CameraCapture from "./pages/CameraCapture";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/debtors" element={<Debtors />} />
          <Route path="/creditors" element={<Creditors />} />
          <Route path="/cash" element={<Cash />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/camera" element={<CameraCapture />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
