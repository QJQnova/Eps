import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { CartProvider } from "@/lib/cart";

// Layout Components
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Pages
import Home from "@/pages/home";
import ProductDetails from "@/pages/product-details";
import Category from "@/pages/category";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderComplete from "@/pages/order-complete";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import ProductManagement from "@/pages/admin/product-management";
import BulkImport from "@/pages/admin/bulk-import";
import ProductFormPage from "@/pages/admin/product-form-page";
import CategoryManagement from "@/pages/admin/category-management";

function Router() {
  const [location] = useLocation();
  
  // Check if the current route is an admin route
  const isAdminRoute = location.startsWith("/admin");
  
  return (
    <>
      {!isAdminRoute && <Header />}
      
      <main className={isAdminRoute ? "bg-gray-50 min-h-screen" : ""}>
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={Home} />
          <Route path="/product/:slug" component={ProductDetails} />
          <Route path="/category/:slug" component={Category} />
          <Route path="/cart" component={Cart} />
          <Route path="/auth" component={AuthPage} />
          
          {/* Protected Routes (требуют авторизации) */}
          <ProtectedRoute path="/checkout" component={Checkout} />
          <ProtectedRoute path="/order-complete/:id" component={OrderComplete} />
          <ProtectedRoute path="/profile" component={Profile} />
          
          {/* Admin Routes */}
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <ProtectedRoute path="/admin/products" component={ProductManagement} />
          <ProtectedRoute path="/admin/products/create" component={ProductFormPage} />
          <ProtectedRoute path="/admin/products/edit/:id" component={ProductFormPage} />
          <ProtectedRoute path="/admin/import" component={BulkImport} />
          <ProtectedRoute path="/admin/categories" component={CategoryManagement} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
