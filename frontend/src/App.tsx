import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Receipts from "./pages/Receipts";
import ReceiptDetail from "./pages/ReceiptDetail";
import Deliveries from "./pages/Deliveries";
import DeliveryDetail from "./pages/DeliveryDetail";
import Transfers from "./pages/Transfers";
import TransferDetail from "./pages/TransferDetail";
import MoveHistory from "./pages/MoveHistory";
import InventoryAdjustment from "./pages/InventoryAdjustment";
import Warehouses from "./pages/Warehouses";
import Locations from "./pages/Locations";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/receipts/:id" element={<ReceiptDetail />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/deliveries/:id" element={<DeliveryDetail />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/transfers/:id" element={<TransferDetail />} />
            <Route path="/moves" element={<MoveHistory />} />
            <Route path="/adjustments" element={<InventoryAdjustment />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
