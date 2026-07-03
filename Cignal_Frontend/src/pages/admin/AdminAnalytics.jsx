import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Users, CreditCard, Ticket, BrainCircuit } from "lucide-react";
import ticketApi from "../../api/ticketApi";
import customerApi from "../../api/customerApi";
import loadAdminApi from "../../api/loadAdminApi";
import axiosClient from "../../api/axiosClient";
import {
  buildDashboardInsights,
  buildMonthlySeries,
  summarizeTicketsByCategory,
  summarizeTicketsByStatus
} from "../../utils/adminInsights";

const STATUS_BAR   = { Open: "bg-red-500", "In Progress": "bg-amber-400", Resolved: "bg-green-500", Closed: "bg-slate-400" };
const STATUS_BADGE = { Open: "bg-red-100 text-red-700", "In Progress": "bg-amber-100 text-amber-700", Resolved: "bg-green-100 text-green-700", Closed: "bg-slate-100 text-slate-600" };

function getMonthKey(d) {
  if (!d) return null;
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" }),
    });
  }
  return months;
}

export default function AdminAnalytics() {
  const [tickets, setTickets]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loads, setLoads]         = useState([]);
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedMonth, setMonth] = useState(null); // null = all time

  const MONTHS = getLast6Months();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [tRes, cRes, lRes, pRes] = await Promise.all([
          ticketApi.getAdminTickets(),
          customerApi.getCustomers(),
          loadAdminApi.getAll(),
          axiosClient.get("/load/plans").catch(() => ({ data: { plans: [] } })),
        ]);
        if (!active) return;
        setTickets(tRes.data?.tickets || []);
        setCustomers(cRes.data?.customers || []);
        setLoads(lRes.data?.history || []);
        setPlans(pRes.data?.plans || []);
      } catch (err) { console.error(err); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  // Filter by selected month
  const filteredLoads   = useMemo(() => selectedMonth ? loads.filter(l => getMonthKey(l.created_at) === selectedMonth) : loads, [loads, selectedMonth]);
  const filteredTickets = useMemo(() => selectedMonth ? tickets.filter(t => getMonthKey(t.created_at) === selectedMonth) : tickets, [tickets, selectedMonth]);
  const filteredCustomers = useMemo(() => selectedMonth ? customers.filter(c => getMonthKey(c.created_at) === selectedMonth) : customers, [customers, selectedMonth]);

  const statusCounts   = useMemo(() => summarizeTicketsByStatus(filteredTickets), [filteredTickets]);
  const categoryCounts = useMemo(() => summarizeTicketsByCategory(filteredTickets), [filteredTickets]);
  const growth         = useMemo(() => buildMonthlySeries(customers), [customers]);
  const loadGrowth     = useMemo(() => buildMonthlySeries(loads), [loads]);
  const insights       = useMemo(() => buildDashboardInsights({ tickets, customers, loads }), [tickets, customers, loads]);

  const totalRevenue = filteredLoads.reduce((s, l) => s + Number(l?.loadAmount || 0), 0);
  const resolvedRate = filteredTickets.length
    ? Math.round((filteredTickets.filter(t => ["Resolved","Closed"].includes(t.status)).length / filteredTickets.length) * 100)
    : 0;

  // Revenue by location (match customers to loads)
  const revenueByLocation = useMemo(() => {
    const locationMap = {};
    customers.forEach(c => { locationMap[c.accountNumber] = c.location || "Unknown"; });
    const rev = {};
    filteredLoads.forEach(l => {
      const loc = locationMap[l.accountNumber] || "Unknown";
      rev[loc] = (rev[loc] || 0) + Number(l.loadAmount || 0);
    });
    return Object.entries(rev).sort((a, b) => b[1] - a[1]);
  }, [filteredLoads, customers]);

  const BarChart = ({ data, color = "bg-red-500", valuePrefix = "" }) => {
    const max = Math.max(...data.map(d => d.value || d[1] || 0), 1);
    const entries = Array.isArray(data[0]) ? data : data.map(d => [d.label || d.key, d.value]);
    return (
      <div className="flex h-28 items-end gap-1.5 border-b border-l border-dashed border-slate-200 pb-2 pl-2">
        {entries.map(([label, value], i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-slate-400" style={{ fontSize: "9px" }}>{valuePrefix}{Number(value || 0).toLocaleString()}</span>
            <div className="flex h-20 items-end w-full">
              <div className={`w-full rounded-t-lg ${color}`}
                style={{ height: `${Math.max(((value || 0) / max) * 75, value ? 4 : 2)}px` }} />
            </div>
            <span className="text-slate-500 text-center" style={{ fontSize: "9px" }}>{label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">System performance and subscriber insights</p>
        </div>
        {/* Month Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setMonth(null)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              selectedMonth === null ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            ● All Time
          </button>
          {MONTHS.map(m => (
            <button key={m.key} onClick={() => setMonth(m.key)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                selectedMonth === m.key ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {selectedMonth && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <p className="text-xs text-amber-700 font-semibold">
            Showing data for {MONTHS.find(m => m.key === selectedMonth)?.label} — 
            {filteredLoads.length} transactions, {filteredTickets.length} tickets, {filteredCustomers.length} new customers
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue",   value: `₱${totalRevenue.toLocaleString()}`, color: "text-green-600",  icon: <CreditCard size={15} className="text-green-500" /> },
          { label: "Total Customers", value: filteredCustomers.length,             color: "text-blue-600",   icon: <Users size={15} className="text-blue-500" /> },
          { label: "Total Tickets",   value: filteredTickets.length,               color: "text-red-600",    icon: <Ticket size={15} className="text-red-500" /> },
          { label: "Resolution Rate", value: `${resolvedRate}%`,                   color: "text-amber-600",  icon: <TrendingUp size={15} className="text-amber-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-xs text-slate-500">{s.label}</p></div>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticket Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Ticket Status Distribution</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([label, value]) => {
              const total = Math.max(Object.values(statusCounts).reduce((s, v) => s + v, 0), 1);
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[label] || "bg-slate-100 text-slate-600"}`}>{label}</span>
                    <span className="text-slate-500 font-semibold">{value} ({Math.round((value / total) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STATUS_BAR[label] || "bg-slate-400"}`}
                      style={{ width: `${Math.max((value / total) * 100, value ? 4 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Ticket Categories</h2>
          {categoryCounts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No tickets yet.</div>
          ) : (
            <div className="space-y-2">
              {categoryCounts.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-xs text-slate-700">{c.label}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Customer Growth (6 months)</h2>
          <BarChart data={growth} color="bg-blue-500" />
        </div>

        {/* Load Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Load Activity (6 months)</h2>
          <BarChart data={loadGrowth} color="bg-green-500" />
        </div>

        {/* Revenue by Location */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Revenue by Location</h2>
          {revenueByLocation.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No transaction data yet.</div>
          ) : (
            <BarChart data={revenueByLocation} color="bg-purple-500" valuePrefix="₱" />
          )}
        </div>

        {/* Plans Available */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Available Plans</h2>
          {plans.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No plans data.</div>
          ) : (
            <div className="space-y-2">
              {plans.filter(p => p.status === "active").map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-xs font-semibold text-slate-800">{p.plan_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600">₱{Number(p.amount).toLocaleString()}</p>
                    <p className="text-slate-400" style={{ fontSize: "10px" }}>{p.hd_channels}HD · {p.sd_channels}SD</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit size={14} className="text-red-600" />
          <h2 className="text-sm font-semibold text-slate-700">AI Operations Summary</h2>
          <span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Top Issue",          value: insights.topIssue },
            { label: "Recurring Concern",  value: insights.repeatedConcern },
            { label: "Operations Summary", value: insights.operationsSummary },
          ].map(f => (
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
      </div>
    </div>
  );
}
