import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TicketIcon, WrenchScrewdriverIcon, UsersIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { BrainCircuit, ArrowRight } from "lucide-react";
import ticketApi from "../../api/ticketApi";
import customerApi from "../../api/customerApi";
import loadAdminApi from "../../api/loadAdminApi";
import { buildDashboardInsights, buildMonthlySeries, summarizeTicketsByStatus } from "../../utils/adminInsights";

const STATUS_BADGE = {
  Open:          "bg-red-100 text-red-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Resolved:      "bg-green-100 text-green-700",
  Closed:        "bg-slate-100 text-slate-600",
};
const STATUS_BAR = {
  Open: "bg-red-500", "In Progress": "bg-amber-400", Resolved: "bg-green-500", Closed: "bg-slate-400",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loads, setLoads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [tRes, cRes, lRes] = await Promise.all([
          ticketApi.getAdminTickets(),
          customerApi.getCustomers(),
          loadAdminApi.getAll(),
        ]);
        if (!active) return;
        setTickets(tRes.data?.tickets || []);
        setCustomers(cRes.data?.customers || []);
        setLoads(lRes.data?.history || []);
      } catch { if (active) setError("Failed to load dashboard."); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const statusCounts  = useMemo(() => summarizeTicketsByStatus(tickets), [tickets]);
  const growth        = useMemo(() => buildMonthlySeries(customers), [customers]);
  const insights      = useMemo(() => buildDashboardInsights({ tickets, customers, loads }), [tickets, customers, loads]);
  const totalRevenue  = loads.reduce((s, l) => s + Number(l?.loadAmount || 0), 0);
  const techCount     = tickets.filter(t => t.category === "Technician Request").length;

  const KPI = ({ label, value, color, bg, icon, onClick }) => (
    <div onClick={onClick} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-3`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{loading ? "..." : value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">CignalCare+ operations overview</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total Tickets"   value={tickets.filter(t => t.category !== "Technician Request").length} color="text-red-600"   bg="bg-red-50"   icon={<TicketIcon className="h-5 w-5" />}           onClick={() => navigate("/admin/tickets")} />
        <KPI label="Total Customers" value={customers.length} color="text-blue-600"  bg="bg-blue-50"  icon={<UsersIcon className="h-5 w-5" />}            onClick={() => navigate("/admin/customers")} />
        <KPI label="Tech Requests"   value={techCount}        color="text-amber-600" bg="bg-amber-50" icon={<WrenchScrewdriverIcon className="h-5 w-5" />} onClick={() => navigate("/admin/technicians")} />
        <KPI label="Total Revenue"   value={`₱${totalRevenue.toLocaleString()}`} color="text-green-600" bg="bg-green-50" icon={<CreditCardIcon className="h-5 w-5" />} onClick={() => navigate("/admin/transactions")} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Ticket Status Overview</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([label, value]) => {
              const total = Math.max(Object.values(statusCounts).reduce((s, v) => s + v, 0), 1);
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[label] || "bg-slate-100 text-slate-600"}`}>{label}</span>
                    <span className="text-slate-500 font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STATUS_BAR[label] || "bg-slate-400"}`}
                      style={{ width: `${Math.max((value / total) * 100, value ? 6 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Customer Growth</h2>
          <div className="flex h-32 items-end gap-1.5 border-b border-l border-dashed border-slate-200 pb-2 pl-2">
            {growth.map(point => {
              const max = Math.max(...growth.map(p => p.value), 1);
              return (
                <div key={point.key} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-slate-400" style={{ fontSize: "9px" }}>{point.value}</span>
                  <div className="flex h-20 items-end w-full">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-red-600 to-red-400"
                      style={{ height: `${Math.max((point.value / max) * 75, point.value ? 6 : 2)}px` }} />
                  </div>
                  <span className="text-slate-500" style={{ fontSize: "9px" }}>{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={14} className="text-red-600" />
            <h2 className="text-sm font-semibold text-slate-700">AI Insights</h2>
            <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase" style={{ fontSize: "10px" }}>Top Issue</p>
              <p className="text-xs text-slate-800 font-semibold mt-1">{insights.topIssue}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase" style={{ fontSize: "10px" }}>Resolution Rate</p>
              <p className="text-xs text-slate-800 font-semibold mt-1">{insights.resolutionRate}%</p>
            </div>
            <div className="bg-red-600 rounded-xl p-3 text-white">
              <p className="font-semibold uppercase opacity-80" style={{ fontSize: "10px" }}>Recommendation</p>
              <p className="text-xs leading-relaxed mt-1">{insights.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Tickets</h2>
            <button onClick={() => navigate("/admin/tickets")} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
              View All <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            : tickets.filter(t => t.category !== "Technician Request").slice(0, 5).length === 0
            ? <div className="py-8 text-center text-xs text-slate-400">No tickets yet.</div>
            : tickets.filter(t => t.category !== "Technician Request").slice(0, 5).map(t => (
              <div key={t.id} onClick={() => navigate(`/admin/chat/${t.id}`)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{t.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.category} · #{t.id}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[t.status] || "bg-slate-100 text-slate-600"}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Customers</h2>
            <button onClick={() => navigate("/admin/customers")} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
              View All <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            : customers.slice(0, 5).length === 0
            ? <div className="py-8 text-center text-xs text-slate-400">No customers yet.</div>
            : customers.slice(0, 5).map(c => (
              <div key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.accountName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{c.accountName}</p>
                    <p className="text-xs text-slate-400 font-mono">{c.accountNumber}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{c.location || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
