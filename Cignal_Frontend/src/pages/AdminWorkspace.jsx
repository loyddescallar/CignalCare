import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  TicketIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import AdminDashboard from "./AdminDashboard";
import AdminCustomers from "./AdminCustomers";
import AdminCustomerProfile from "./AdminCustomerProfile";
import AdminPOS from "./AdminPOS";
import AdminTickets from "./AdminTickets";
import AdminTechnicianRequests from "./AdminTechnicianRequests";
import AdminAnalytics from "./AdminAnalytics";
import AdminPlans from "./AdminPlans";
import AdminTransactions from "./AdminTransactions";
import AdminLoadRequests from "./AdminLoadRequests";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      { key: "dashboard", label: "Dashboard", icon: HomeIcon, path: "/admin-dashboard" },
    ],
  },
  {
    title: "SUBSCRIBER MANAGEMENT",
    items: [
      { key: "customers",   label: "Customers",            icon: UsersIcon,             path: "/admin/customers" },
      { key: "tickets",     label: "Tickets",              icon: TicketIcon,            path: "/admin/tickets" },
      { key: "technicians", label: "Technician Requests",  icon: WrenchScrewdriverIcon, path: "/admin/technicians" },
    ],
  },
  {
    title: "PREPAID & BILLING",
    items: [
      { key: "plans",         label: "Plans",         icon: ClipboardDocumentListIcon, path: "/admin/plans" },
      { key: "pos",           label: "POS / Prepaid", icon: CreditCardIcon,            path: "/admin/pos" },
      { key: "transactions",  label: "Transactions",  icon: ClipboardDocumentListIcon, path: "/admin/transactions" },
      { key: "load-requests", label: "Load Requests", icon: CreditCardIcon,            path: "/admin/load-requests" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { key: "reports", label: "Reports", icon: ChartBarIcon, path: "/admin/analytics" },
    ],
  },
];

function getSectionFromPath(pathname) {
  // Customer profile: /admin/customers/:id
  if (/^\/admin\/customers\/\d+$/.test(pathname)) return "customer-profile";
  for (const group of menuGroups) {
    const found = group.items.find(item => item.path === pathname);
    if (found) return found.key;
  }
  return "dashboard";
}

export default function AdminWorkspace() {
  const location = useLocation();
  const navigate  = useNavigate();

  const activeSection = useMemo(() => getSectionFromPath(location.pathname), [location.pathname]);

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem("adminUser")) || {}; }
    catch { return {}; }
  })();

  const logout = () => {
    localStorage.clear();
    navigate("/admin-login");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":        return <AdminDashboard />;
      case "customers":        return <AdminCustomers />;
      case "customer-profile": return <AdminCustomerProfile />;
      case "plans":            return <AdminPlans />;
      case "pos":              return <AdminPOS />;
      case "transactions":     return <AdminTransactions />;
      case "load-requests":    return <AdminLoadRequests />;
      case "tickets":          return <AdminTickets />;
      case "technicians":      return <AdminTechnicianRequests />;
      case "reports":          return <AdminAnalytics />;
      default:                 return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-slate-950 text-white flex flex-col min-h-screen flex-shrink-0">

        {/* Brand */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-5">
          <h1 className="text-xl font-bold">CignalCare+</h1>
          <p className="text-xs text-white/70 mt-0.5">Descallar Satellite Services</p>
        </div>

        {/* Admin Profile */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm relative flex-shrink-0">
            {(adminUser.name || adminUser.accountName || "A").charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{adminUser.name || adminUser.accountName || "Admin"}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {menuGroups.map(group => (
            <div key={group.title}>
              <p className="text-xs text-slate-500 px-3 mb-2 tracking-widest font-semibold">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = activeSection === item.key ||
                    (item.key === "customers" && activeSection === "customer-profile");
                  return (
                    <button key={item.key} onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-left text-sm ${
                        active ? "bg-red-600 text-white shadow-md" : "text-slate-300 hover:bg-white/5"
                      }`}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
          <p className="text-xs text-slate-500 text-center mt-3">© 2026 CignalCare+</p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
