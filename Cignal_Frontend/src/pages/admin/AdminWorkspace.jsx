import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  HomeIcon, UsersIcon, CreditCardIcon,
  ClipboardDocumentListIcon, TicketIcon,
  WrenchScrewdriverIcon, ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import AdminDashboard from "./AdminDashboard";
import AdminCustomers from "./AdminCustomers";
import AdminCustomerProfile from "./AdminCustomerProfile";
import AdminTickets from "./AdminTickets";
import AdminTechnicianRequests from "./AdminTechnicianRequests";
import AdminLoadRequests from "./AdminLoadRequests";
import AdminPOS from "./AdminPOS";
import AdminPlans from "./AdminPlans";
import AdminTransactions from "./AdminTransactions";
import AdminAnalytics from "./AdminAnalytics";

const menuGroups = [
  { title: "OVERVIEW", items: [{ key: "dashboard", label: "Dashboard", icon: HomeIcon, path: "/admin-dashboard" }] },
  {
    title: "SUBSCRIBER MANAGEMENT",
    items: [
      { key: "customers",   label: "Customers",           icon: UsersIcon,             path: "/admin/customers" },
      { key: "tickets",     label: "Tickets",             icon: TicketIcon,            path: "/admin/tickets" },
      { key: "technicians", label: "Technician Requests", icon: WrenchScrewdriverIcon, path: "/admin/technicians" },
    ],
  },
  {
    title: "PREPAID & BILLING",
    items: [
      { key: "plans",         label: "Plans",        icon: ClipboardDocumentListIcon, path: "/admin/plans" },
      { key: "pos",           label: "POS / Prepaid", icon: CreditCardIcon,           path: "/admin/pos" },
      { key: "transactions",  label: "Transactions",  icon: ClipboardDocumentListIcon, path: "/admin/transactions" },
      { key: "load-requests", label: "Load Requests", icon: CreditCardIcon,           path: "/admin/load-requests" },
    ],
  },
  { title: "ANALYTICS", items: [{ key: "analytics", label: "Analytics", icon: ChartBarIcon, path: "/admin/analytics" }] },
];

function getSectionFromPath(pathname) {
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

  const logout = () => { localStorage.clear(); navigate("/admin-login"); };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":        return <AdminDashboard />;
      case "customers":        return <AdminCustomers />;
      case "customer-profile": return <AdminCustomerProfile />;
      case "tickets":          return <AdminTickets />;
      case "technicians":      return <AdminTechnicianRequests />;
      case "plans":            return <AdminPlans />;
      case "pos":              return <AdminPOS />;
      case "transactions":     return <AdminTransactions />;
      case "load-requests":    return <AdminLoadRequests />;
      case "analytics":        return <AdminAnalytics />;
      default:                 return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex">
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-slate-950 text-white flex flex-col min-h-screen flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-red-700 to-red-600 px-5 py-5"
        >
          <h1 className="text-xl font-bold">CignalCare+</h1>
          <p className="text-xs text-white/70 mt-0.5">Descallar Satellite Services</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="px-4 py-4 border-b border-white/10 flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm relative flex-shrink-0">
            {(adminUser.accountName || adminUser.name || "A").charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{adminUser.accountName || adminUser.name || "Admin"}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </motion.div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {menuGroups.map((group, gi) => (
            <div key={group.title}>
              <p className="text-xs text-slate-500 px-3 mb-2 tracking-widest font-semibold">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item, i) => {
                  const Icon = item.icon;
                  const active = activeSection === item.key ||
                    (item.key === "customers" && activeSection === "customer-profile");
                  return (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.06 + i * 0.05, duration: 0.25 }}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left text-sm ${
                        active ? "bg-red-600 text-white shadow" : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="p-4 border-t border-white/10"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
          </motion.button>
          <p className="text-xs text-slate-500 text-center mt-3">© 2026 CignalCare+</p>
        </motion.div>
      </aside>

      {/* MAIN with page transitions */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
