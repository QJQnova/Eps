import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { CartProvider } from "@/lib/cart";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";

// Layout Components
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import TopBanner from "@/components/layout/top-banner";

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
import PasswordResetPage from "@/pages/password-reset-page";
import ServicesPage from "@/pages/services";
import PromotionsPage from "@/pages/promotions";
import PublicationsPage from "@/pages/publications";
import AboutPage from "@/pages/about";
import ContactsPage from "@/pages/contacts";
import Products from "@/pages/products";
import EmergencyDeletePage from "@/pages/emergency-delete";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import ProductManagement from "@/pages/admin/product-management";
import BulkImport from "@/pages/admin/bulk-import";
import ProductFormPage from "@/pages/admin/product-form-page";
import CategoryManagement from "@/pages/admin/category-management";
import OrderManagement from "@/pages/admin/order-management";
import UserManagement from "@/pages/admin/user-management";
import SettingsManagement from "@/pages/admin/settings-management";
import SqlDeletePage from "@/pages/admin/sql-delete";
import SupplierImporter from "@/pages/admin/supplier-importer";
import CatalogAdapter from "@/pages/admin/catalog-adapter";
import WebScraper from "@/pages/admin/web-scraper";
import MassScraper from "@/pages/admin/mass-scraper";

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
          <Route path="/password-reset" component={PasswordResetPage} />
          <Route path="/password-reset/reset" component={PasswordResetPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/promotions" component={PromotionsPage} />
          <Route path="/publications" component={PublicationsPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contacts" component={ContactsPage} />
          <Route path="/products" component={Products} />
          <Route path="/emergency-delete" component={EmergencyDeletePage} />
          
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
          <ProtectedRoute path="/admin/catalog-adapter" component={CatalogAdapter} />
          <ProtectedRoute path="/admin/web-scraper" component={WebScraper} />
          <ProtectedRoute path="/admin/mass-scraper" component={MassScraper} />
          <ProtectedRoute path="/admin/categories" component={CategoryManagement} />
          <ProtectedRoute path="/admin/orders" component={OrderManagement} />
          <ProtectedRoute path="/admin/users" component={UserManagement} />
          <ProtectedRoute path="/admin/settings" component={SettingsManagement} />
          <ProtectedRoute path="/admin/sql-delete" component={SqlDeletePage} />
          <ProtectedRoute path="/admin/supplier-importer" component={SupplierImporter} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  // Добавляем дату обновления для сброса кеша
  const updateVersion = "15.05.2025.13:16"; // обновленная дата и время
  console.log("ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ", updateVersion);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router />
          <InstallAppPrompt />
          <Toaster />
          {/* Невидимый элемент с информацией о версии */}
          <div style={{ display: "none" }} data-version={updateVersion}></div>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
