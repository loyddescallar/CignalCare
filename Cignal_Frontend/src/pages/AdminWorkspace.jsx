import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  TicketIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  Bars3Icon,
  BellIcon,
  EnvelopeIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

import AdminDashboard from "./AdminDashboard";
import AdminCustomers from "./AdminCustomers";
import AdminPOS from "./AdminPOS";
import AdminTickets from "./AdminTickets";
import AdminTechnicianRequests from "./AdminTechnicianRequests";
import AdminAnalytics from "./AdminAnalytics";
import AdminPlans from "./AdminPlans";
import AdminTransactions from "./AdminTransactions";
import AdminLoadRequests from "./AdminLoadRequests";

/* =========================
   MENU STRUCTURE (FIGMA STYLE)
========================= */
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
      { key: "customers", label: "Customers", icon: UsersIcon, path: "/admin/customers" },
      { key: "tickets", label: "Tickets", icon: TicketIcon, path: "/admin/tickets" },
      { key: "technicians", label: "Technician Requests", icon: WrenchScrewdriverIcon, path: "/admin/technicians" },
    ],
  },
  {
    title: "PREPAID & BILLING",
    items: [
      { key: "plans", label: "Plans", icon: ClipboardDocumentListIcon, path: "/admin/plans" },
      { key: "pos", label: "POS / Prepaid", icon: CreditCardIcon, path: "/admin/pos" },
      { key: "transactions", label: "Transactions", icon: ClipboardDocumentListIcon, path: "/admin/transactions" },
      { key: "load-requests", label: "Load Requests", icon: CreditCardIcon, path: "/admin/load-requests" },
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
  for (const group of menuGroups) {
    const found = group.items.find((item) => item.path === pathname);
    if (found) return found.key;
  }
  return "dashboard";
}

function getSearchRoute(query) {
  const q = query.toLowerCase();

  if (q.includes("customer") || q.includes("account") || q.includes("cca"))
    return "/admin/customers";
  if (q.includes("ticket") || q.includes("chat") || q.includes("support"))
    return "/admin/tickets";
  if (q.includes("tech"))
    return "/admin/technicians";
  if (q.includes("request") && q.includes("load"))
    return "/admin/load-requests";
  if (q.includes("load") || q.includes("pos") || q.includes("prepaid"))
    return "/admin/pos";
  if (q.includes("transaction") || q.includes("payment"))
    return "/admin/transactions";
  if (q.includes("report") || q.includes("analytic"))
    return "/admin/analytics";

  return "/admin-dashboard";
}

export default function AdminWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const activeSection = useMemo(
    () => getSectionFromPath(location.pathname),
    [location.pathname]
  );

  /* 🔥 DYNAMIC ADMIN */
  const adminUser = JSON.parse(localStorage.getItem("adminUser")) || {
    name: "Admin",
    role: "Super Administrator",
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard embedded />;
      case "customers":
        return <AdminCustomers embedded />;
      case "plans":
        return <AdminPlans embedded />;
      case "pos":
        return <AdminPOS embedded />;
      case "transactions":
        return <AdminTransactions embedded />;
      case "load-requests":
        return <AdminLoadRequests embedded />;
      case "tickets":
        return <AdminTickets embedded />;
      case "technicians":
        return <AdminTechnicianRequests embedded />;
      case "reports":
        return <AdminAnalytics embedded />;
      default:
        return <AdminDashboard embedded />;
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(getSearchRoute(search));
  };

  return (
    <div className="min-h-screen bg-slate-200 flex">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-[320px] bg-slate-950 text-white flex flex-col min-h-screen">

        {/* BRAND */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-6">
          <h1 className="text-2xl font-bold">CignalCare+</h1>
          <p className="text-sm text-white/80">Descallar Satellite Services</p>
        </div>

        {/* ADMIN PROFILE */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-red-600 flex items-center justify-center font-bold relative">
            {adminUser.name?.charAt(0)}

            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-slate-950" />
          </div>

          <div>
            <p className="font-semibold text-white">{adminUser.name}</p>
            <p className="text-xs text-slate-400">{adminUser.role}</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs text-slate-400 px-3 mb-2 tracking-widest">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left
                        ${active
                          ? "bg-red-600 text-white shadow-md"
                          : "text-slate-300 hover:bg-white/5"
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-xl">
            Logout
          </button>

          <p className="text-xs text-slate-500 text-center mt-3">
            © 2026 CignalCare+
          </p>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 min-w-0 bg-slate-200">

        {/* CONTENT */}
        <div className="p-6">
          {renderContent()}
        </div>

      </main>
    </div>
  );
}