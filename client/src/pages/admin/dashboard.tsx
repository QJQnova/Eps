import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  ShoppingBag,
  Package2,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/admin/sidebar";
import { Category, Product } from "@shared/schema";

// Overview cards data
const overviewCards = [
  {
    title: "Total Revenue",
    value: "$15,231.89",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Products",
    value: "0", // Will be updated from API data
    change: "+4.3%",
    trend: "up",
    icon: Package2,
  },
  {
    title: "Categories",
    value: "0", // Will be updated from API data
    change: "0%",
    trend: "neutral",
    icon: ShoppingBag,
  },
  {
    title: "Customers",
    value: "573",
    change: "+9.1%",
    trend: "up",
    icon: Users,
  },
];

export default function AdminDashboard() {
  // Fetch all products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch all categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Update overview cards with real data
  const activeProducts = products.filter(p => p.isActive).length;
  const categoryCount = categories.length;
  
  // Updated cards
  const updatedCards = [...overviewCards];
  updatedCards[1].value = activeProducts.toString();
  updatedCards[2].value = categoryCount.toString();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back to your admin dashboard.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/import">Bulk Import</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/products">Manage Products</Link>
            </Button>
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {updatedCards.map((card, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  {card.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                  ) : card.trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 mr-1 text-rose-500" />
                  ) : (
                    <span className="h-3 w-3 mr-1" />
                  )}
                  <span className={
                    card.trend === 'up' 
                      ? 'text-emerald-500' 
                      : card.trend === 'down' 
                        ? 'text-rose-500' 
                        : ''
                  }>
                    {card.change} from last month
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button className="justify-start" asChild>
                <Link href="/admin/products/create">
                  <Package2 className="mr-2 h-4 w-4" />
                  Add New Product
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/admin/import">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Import Products
                </Link>
              </Button>
              <Button variant="outline" className="justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Sales Report
              </Button>
            </CardContent>
          </Card>
          
          {/* Recent Orders */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded">
                        <ShoppingBag className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Order #{1000 + i}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-right">${(Math.random() * 300 + 50).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {i === 0 ? "Processing" : i === 1 ? "Shipped" : "Delivered"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>
              Product count by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.productCount} products</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (category.productCount || 0) / (Math.max(...categories.map(c => c.productCount || 0)) || 1) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
