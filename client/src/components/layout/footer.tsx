import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, you would send this to your API
    toast({
      title: "Newsletter Subscription",
      description: `You've been subscribed with: ${email}`,
    });
    
    setEmail("");
  };
  
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">ToolMaster</h3>
            <p className="text-gray-400 mb-4">Your trusted source for professional tools and equipment.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/category/power-tools" className="text-gray-400 hover:text-white transition duration-200">
                  Power Tools
                </Link>
              </li>
              <li>
                <Link href="/category/hand-tools" className="text-gray-400 hover:text-white transition duration-200">
                  Hand Tools
                </Link>
              </li>
              <li>
                <Link href="/category/measuring-tools" className="text-gray-400 hover:text-white transition duration-200">
                  Measuring Tools
                </Link>
              </li>
              <li>
                <Link href="/category/safety-equipment" className="text-gray-400 hover:text-white transition duration-200">
                  Safety Equipment
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition duration-200">
                  All Products
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition duration-200">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition duration-200">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-white transition duration-200">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition duration-200">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Newsletter</h4>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest product updates and promotions.</p>
            <form className="flex" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-lg flex-1 text-gray-900 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-r-lg transition duration-200"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} ToolMaster. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm mx-3 transition duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm mx-3 transition duration-200">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm mx-3 transition duration-200">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
