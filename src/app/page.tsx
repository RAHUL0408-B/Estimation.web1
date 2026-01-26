import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Store, Shield, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center text-white font-bold text-xl">
              Λ
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">Antigravity Design</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-500 hover:text-[#0F172A] transition-colors">Features</Link>
            <Link href="#solutions" className="text-sm font-medium text-gray-500 hover:text-[#0F172A] transition-colors">Solutions</Link>
            <Link href="/login" className="text-sm font-medium text-[#0F172A] hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">Sign In</Link>
            <Link href="/signup">
              <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 rounded-lg h-11">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                The Future of Interior Design Business
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-[#0F172A] leading-[1.1]">
                Scale your design studio <br />
                <span className="text-blue-600">with precision.</span>
              </h1>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                The all-in-one multi-tenant OS for interior designers. Manage clients, generate instant estimates,
                and launch your branded storefront in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Link href="/signup">
                  <Button size="lg" className="bg-[#0F172A] hover:bg-[#1E293B] text-white h-14 px-8 rounded-full text-lg font-semibold group">
                    Launch Your Studio
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/amit-interiors">
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg font-semibold border-gray-200">
                    View Demo Store
                  </Button>
                </Link>
              </div>
            </div>

            {/* Application Preview / Dashboard Mockup */}
            <div className="mt-20 relative px-4">
              <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full max-w-4xl mx-auto transition-all"></div>
              <div className="relative rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] max-w-5xl mx-auto scale-[1.02] border-[#F1F5F9]">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border flex items-center justify-center mx-auto">
                      <LayoutDashboard className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Dashboard Preview Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-gray-50/50">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-blue-600">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A]">E-commerce Engine</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Full-featured storefront for furniture and finishes. Integrated inventory and order management system.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-blue-600">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A]">Smart Estimates</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Built-in calculator for instant client quotes. Automate your sales funnel with precision logic.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-blue-600">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A]">Multi-Tenant CRM</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Isolated client data, communication logs, and project tracking for every designer on your platform.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              Λ
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F172A]">Antigravity Design</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <Link href="/admin" className="hover:text-[#0F172A]">Platform Admin</Link>
            <Link href="/dashboard" className="hover:text-[#0F172A]">Designer Console</Link>
            <span>&copy; 2024 Antigravity Design Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
