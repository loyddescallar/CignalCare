import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp, Users, CreditCard } from "lucide-react";
import { BrainCircuit } from "lucide-react";
import ticketApi from "../../api/ticketApi";
import customerApi from "../../api/customerApi";
import loadAdminApi from "../../api/loadAdminApi";
import { buildDashboardInsights, buildMonthlySeries, summarizeTicketsByCategory, summarizeTicketsByStatus } from "../../utils/adminInsights";

const STATUS_BAR   = { Open: "bg-red-500", "In Progress": "bg-amber-400", Resolved: "bg-green-500", Closed: "bg-slate-400" };
const STATUS_BADGE = { Open: "bg-red-100 text-red-700", "In Progress": "bg-amber-100 text-amber-700", Resolved: "bg-green-100 text-green-700", Closed: "bg-slate-100 text-slate-600" };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

export default function AdminAnalytics() {
  const [tickets, setTickets]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loads, setLoads]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [tRes, cRes, lRes] = await Promise.all([ticketApi.getAdminTickets(), customerApi.getCustomers(), loadAdminApi.getAll()]);
        if (!active) return;
        setTickets(tRes.data?.tickets || []);
        setCustomers(cRes.data?.customers || []);
        setLoads(lRes.data?.history || []);
      } catch (err) { console.error(err); } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const statusCounts   = useMemo(() => summarizeTicketsByStatus(tickets), [tickets]);
  const categoryCounts = useMemo(() => summarizeTicketsByCategory(tickets), [tickets]);
  const growth         = useMemo(() => buildMonthlySeries(customers), [customers]);
  const loadGrowth     = useMemo(() => buildMonthlySeries(loads), [loads]);
  const insights       = useMemo(() => buildDashboardInsights({ tickets, customers, loads }), [tickets, customers, loads]);
  const totalRevenue   = loads.reduce((s, l) => s + Number(l?.loadAmount || 0), 0);
  const resolvedRate   = tickets.length ? Math.round((tickets.filter(t => ["Resolved","Closed"].includes(t.status)).length / tickets.length) * 100) : 0;

  const kpis = [
    { label: "Total Revenue",   value: `₱${totalRevenue.toLocaleString()}`, color: "text-green-600",  icon: <CreditCard size={15} className="text-green-500" /> },
    { label: "Total Customers", value: customers.length,                     color: "text-blue-600",   icon: <Users size={15} className="text-blue-500" /> },
    { label: "Total Tickets",   value: tickets.length,                       color: "text-red-600",    icon: null },
    { label: "Resolution Rate", value: `${resolvedRate}%`,                   color: "text-amber-600",  icon: <TrendingUp size={15} className="text-amber-500" /> },
  ];

  const BarChart = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex h-28 items-end gap-1.5 border-b border-l border-dashed border-slate-200 pb-2 pl-2">
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * 75, d.value ? 4 : 2);
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-slate-400" style={{ fontSize: "9px" }}>{d.value}</span>
              <div className="flex h-20 items-end w-full">
                <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                  className={`w-full rounded-t-lg ${color}`} />
              </div>
              <span className="text-slate-500" style={{ fontSize: "9px" }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-lg font-bold text-slate-800">Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">System performance and subscriber insights</p>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(s => (
          <motion.div key={s.label} variants={fadeUp} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-xs text-slate-500">{s.label}</p></div>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Ticket Status Distribution</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([label, value]) => {
              const total = Math.max(Object.values(statusCounts).reduce((s, v) => s + v, 0), 1);
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[label] || "bg-slate-100 text-slate-600"}`}>{label}</span>
                    <span className="text-slate-500 font-semibold">{value} ({Math.round((value/total)*100)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max((value/total)*100, value?4:0)}%` }}
                      transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${STATUS_BAR[label] || "bg-slate-400"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Ticket Categories</h2>
          {categoryCounts.length === 0 ? <div className="py-8 text-center text-xs text-slate-400">No tickets yet.</div>
          : <div className="space-y-2">
              {categoryCounts.slice(0, 5).map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.25 }}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                    <p className="text-xs text-slate-700">{c.label}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{c.value}</span>
                </motion.div>
              ))}
            </div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Customer Growth (6 months)</h2>
          <BarChart data={growth} color="bg-blue-500" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Load Activity (6 months)</h2>
          <BarChart data={loadGrowth} color="bg-green-500" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit size={14} className="text-red-600" />
          <h2 className="text-sm font-semibold text-slate-700">AI Operations Summary</h2>
          <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[{label:"Top Issue",value:insights.topIssue},{label:"Recurring Concern",value:insights.repeatedConcern},{label:"Operations Summary",value:insights.operationsSummary}].map(f => (
            <div key={f.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase" style={{ fontSize: "10px" }}>{f.label}</p>
              <p className="text-xs text-slate-800 leading-relaxed mt-1">{f.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-red-600 rounded-xl p-4 text-white">
          <p className="font-semibold uppercase opacity-80" style={{ fontSize: "10px" }}>Recommendation</p>
          <p className="text-xs leading-relaxed mt-1">{insights.recommendation}</p>
        </div>
      </motion.div>
    </div>
  );
}
