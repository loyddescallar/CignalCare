import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, User, Hash, Tv, CheckCircle2, Clock, AlertTriangle, ChevronRight, Calendar, Banknote, ShieldCheck, TrendingUp, Flag, CreditCard, Wrench, BrainCircuit, Info } from "lucide-react";
import customerApi from "../../api/customerApi";
import ticketApi from "../../api/ticketApi";
import axiosClient from "../../api/axiosClient";

function getActivityStatus(lastLoadDate) {
  if (!lastLoadDate) return "Inactive";
  const days = (Date.now() - new Date(lastLoadDate).getTime()) / 86400000;
  if (days <= 30) return "Active"; if (days <= 60) return "At Risk"; return "Inactive";
}
function formatDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }); }
function computeChurnScore(lastLoadDate, activeTickets, openTechReqs) {
  let risk = 10; const reasons = [];
  const status = getActivityStatus(lastLoadDate);
  if (status === "Inactive") { risk += 40; reasons.push("no reload in 60+ days"); }
  else if (status === "At Risk") { risk += 25; reasons.push("31–60 days without reload"); }
  if (activeTickets > 0) { risk += activeTickets * 12; reasons.push(`${activeTickets} active ticket${activeTickets > 1 ? "s" : ""}`); }
  if (openTechReqs > 0) { risk += openTechReqs * 10; reasons.push(`${openTechReqs} pending tech request${openTechReqs > 1 ? "s" : ""}`); }
  risk = Math.min(risk, 95);
  const reason = reasons.length ? reasons.join("; ") + "." : status === "Active" ? "Active subscription, no open issues." : "No significant churn signals.";
  return { risk, reason: reason.charAt(0).toUpperCase() + reason.slice(1) };
}
const ticketStatusConfig = {
  Open:          { classes: "bg-red-100 text-red-700",    Icon: Flag },
  "In Progress": { classes: "bg-amber-100 text-amber-700", Icon: Clock },
  Resolved:      { classes: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  Closed:        { classes: "bg-slate-100 text-slate-600", Icon: CheckCircle2 },
};

export default function AdminCustomerProfile() {
  const { id } = useParams(); const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [tickets, setTickets]   = useState([]);
  const [techReqs, setTechReqs] = useState([]);
  const [transactions, setTrans]= useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const custRes = await customerApi.getCustomerById(id);
        const cust = custRes.data?.customer;
        setCustomer(cust);
        const [ticketRes, techRes, txRes] = await Promise.all([
          ticketApi.getAdminTickets().catch(() => ({ data: { tickets: [] } })),
          axiosClient.get("/technicians/requests/admin").catch(() => ({ data: { requests: [] } })),
          axiosClient.get("/load/admin").catch(() => ({ data: { history: [] } })),
        ]);
        const allTickets = ticketRes.data?.tickets || [];
        const allTech    = techRes.data?.requests || [];
        const allTx      = txRes.data?.history || [];
        setTickets(allTickets.filter(t => t.user_id === cust?.id || t.accountNumber === cust?.accountNumber));
        setTechReqs(allTech.filter(r => r.user_id === cust?.id || r.accountNumber === cust?.accountNumber));
        setTrans(allTx.filter(t => t.accountNumber === cust?.accountNumber));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-center"><div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm">Loading profile...</p></div>
    </div>
  );
  if (!customer) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <User size={32} className="mb-3 opacity-30" /><p className="text-sm">Customer not found.</p>
      <button onClick={() => navigate("/admin/customers")} className="mt-3 text-xs text-red-600 hover:underline">← Back</button>
    </div>
  );

  const actStatus    = getActivityStatus(customer.lastLoadDate);
  const activeTickets = tickets.filter(t => !["Resolved","Closed"].includes(t.status)).length;
  const openTechReqs  = techReqs.filter(r => !["Completed","Cancelled"].includes(r.status)).length;
  const churn         = computeChurnScore(customer.lastLoadDate, activeTickets, openTechReqs);
  const totalSpent    = transactions.reduce((s, t) => s + Number(t.loadAmount || t.amount || 0), 0);

  const riskColor = churn.risk >= 70 ? "text-red-600 bg-red-50 border-red-200" : churn.risk >= 40 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-green-600 bg-green-50 border-green-200";
  const riskBar   = churn.risk >= 70 ? "bg-red-500" : churn.risk >= 40 ? "bg-amber-400" : "bg-green-400";
  const actStyle  = { Active: { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" }, "At Risk": { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" }, Inactive: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" } }[actStatus];

  // Spend Timeline — group transactions by month
  const spendByMonth = useMemo(() => {
    const monthMap = {};
    transactions.forEach(t => {
      const d = new Date(t.created_at || t.transaction_date || "");
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-PH", { month: "short" });
      monthMap[key] = { label, value: (monthMap[key]?.value || 0) + Number(t.loadAmount || t.amount || 0) };
    });
    return Object.entries(monthMap).sort().slice(-6).map(([k, v]) => v);
  }, [transactions]);

  function useMemo(factory, deps) {
    const [state, setState] = useState(factory);
    useEffect(() => { setState(factory()); }, deps);
    return state;
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/admin/customers")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600"><ArrowLeft size={13} /> Back to Customers</button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-600 h-2" />
        <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">{customer.accountName?.[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{customer.accountName}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <div className="flex items-center gap-1"><Hash size={11} className="text-slate-400" /><span className="text-xs font-mono text-slate-600">{customer.accountNumber}</span></div>
                  <div className="flex items-center gap-1"><ShieldCheck size={11} className="text-red-600" /><span className="text-xs text-slate-600">{customer.ccaNumber}</span></div>
                  <div className="flex items-center gap-1"><Phone size={11} className="text-slate-400" /><span className="text-xs text-slate-600">{customer.phone}</span></div>
                  <div className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" /><span className="text-xs text-slate-600">{customer.address}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${actStyle.badge}`}><div className={`w-1.5 h-1.5 rounded-full ${actStyle.dot}`}/>{actStatus}</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium">{customer.location} · Since {formatDate(customer.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Load Spend", value: `₱${totalSpent.toLocaleString()}`, sub: `${transactions.length} transactions`, color: "text-red-600",    icon: <CreditCard size={13} className="text-red-600" /> },
          { label: "Total Tickets",    value: tickets.length,                      sub: `${activeTickets} active`,            color: "text-slate-800", icon: <Flag size={13} className="text-purple-500" /> },
          { label: "Service Jobs",     value: techReqs.length,                     sub: `${openTechReqs} pending`,            color: "text-slate-800", icon: <Wrench size={13} className="text-blue-500" /> },
          { label: "AI Churn Risk",    value: `${churn.risk}%`,                   sub: churn.risk >= 70 ? "HIGH" : churn.risk >= 40 ? "MEDIUM" : "LOW", color: churn.risk >= 70 ? "text-red-600" : churn.risk >= 40 ? "text-amber-600" : "text-green-600", icon: <BrainCircuit size={13} className="text-red-600" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-1">{s.icon}<p className="text-xs text-slate-500">{s.label}</p></div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Tabs */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {([{key:"transactions",label:"Transactions",Icon:CreditCard,count:transactions.length},{key:"tickets",label:"Tickets",Icon:Flag,count:tickets.length},{key:"service",label:"Service",Icon:Wrench,count:techReqs.length}]).map(tab=>(
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab===tab.key?"bg-white text-red-600 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
                <tab.Icon size={12}/>{tab.label}<span className={`px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab===tab.key?"bg-red-100 text-red-600":"bg-slate-200 text-slate-500"}`} style={{fontSize:"10px"}}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-4 pt-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">{activeTab==="transactions"?"Load History":activeTab==="tickets"?"Ticket History":"Service History"}</h2>
            </div>
            {activeTab==="transactions"&&(transactions.length===0?<div className="py-10 text-center text-xs text-slate-400">No transactions.</div>:<div className="divide-y divide-slate-50">{transactions.map((tx,i)=>(<div key={i} className="px-4 py-3 hover:bg-slate-50 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-800">₱{Number(tx.loadAmount||tx.amount||0).toLocaleString()}</p><p className="text-xs text-slate-400 mt-0.5">{tx.description||"Prepaid Load"}</p><p className="text-xs text-slate-400 mt-0.5">{formatDate(tx.created_at)}</p></div><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.status==="completed"?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600"}`}>{tx.status||"completed"}</span></div>))}</div>)}
            {activeTab==="tickets"&&(tickets.length===0?<div className="py-10 text-center text-xs text-slate-400">No tickets.</div>:<div className="divide-y divide-slate-50">{tickets.map(t=>{const cfg=ticketStatusConfig[t.status]||ticketStatusConfig["Open"];return(<div key={t.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-2" onClick={()=>navigate(`/admin/chat/${t.id}`)}><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-800 truncate">{t.subject}</p><p className="text-xs text-slate-400 mt-0.5">{t.category} · #{t.id}</p></div><span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.classes}`}><cfg.Icon size={10}/>{t.status}</span></div>);})}</div>)}
            {activeTab==="service"&&(techReqs.length===0?<div className="py-10 text-center text-xs text-slate-400">No service records.</div>:<div className="divide-y divide-slate-50">{techReqs.map(r=>(<div key={r.id} className="px-4 py-3 hover:bg-slate-50 flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-800 truncate">{r.issueDescription}</p><p className="text-xs text-slate-400 mt-0.5">{formatDate(r.created_at)}{r.technician_name&&` · ${r.technician_name}`}</p></div><span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${r.status==="Completed"?"bg-green-100 text-green-700":r.status==="Scheduled"?"bg-blue-100 text-blue-700":r.status==="Cancelled"?"bg-slate-100 text-slate-500":"bg-amber-100 text-amber-700"}`}>{r.status}</span></div>))}</div>)}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-3">
          {/* AI Insight */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3"><BrainCircuit size={14} className="text-red-600"/><h2 className="text-sm font-semibold text-slate-700">AI Insight</h2><span className="ml-auto text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Beta</span></div>
            <div className={`rounded-xl p-3 border mb-3 ${riskColor}`}>
              <p className="text-xs font-bold mb-0.5">Churn Risk: {churn.risk}% — {churn.risk>=70?"HIGH":churn.risk>=40?"MEDIUM":"LOW"}</p>
              <p className="text-xs leading-snug opacity-80">{churn.reason}</p>
              <div className="mt-2 h-2 bg-white/40 rounded-full overflow-hidden"><div className={`h-full rounded-full ${riskBar}`} style={{width:`${churn.risk}%`}}/></div>
            </div>
            <div className="space-y-2">
              {activeTickets>0&&<div className="flex items-start gap-2 bg-red-50 rounded-xl p-2"><AlertTriangle size={11} className="text-red-500 mt-0.5"/><p className="text-xs text-red-700">{activeTickets} active ticket{activeTickets>1?"s":""} — prioritize resolution.</p></div>}
              {openTechReqs>0&&<div className="flex items-start gap-2 bg-amber-50 rounded-xl p-2"><Wrench size={11} className="text-amber-500 mt-0.5"/><p className="text-xs text-amber-700">{openTechReqs} pending tech request{openTechReqs>1?"s":""} — confirm dispatch.</p></div>}
              {activeTickets===0&&openTechReqs===0&&<div className="flex items-start gap-2 bg-green-50 rounded-xl p-2"><CheckCircle2 size={11} className="text-green-500 mt-0.5"/><p className="text-xs text-green-700">No active issues. Strong retention candidate.</p></div>}
            </div>
          </div>

          {/* Load Spend Timeline Chart */}
          {spendByMonth.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3"><CreditCard size={13} className="text-red-600"/><h2 className="text-sm font-semibold text-slate-700">Load Spend Timeline</h2></div>
              <div className="flex h-24 items-end gap-1.5 border-b border-l border-dashed border-slate-200 pb-2 pl-2">
                {spendByMonth.map((m, i) => {
                  const max = Math.max(...spendByMonth.map(x => x.value), 1);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-slate-400" style={{ fontSize: "8px" }}>₱{Number(m.value).toLocaleString()}</span>
                      <div className="flex h-16 items-end w-full">
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-red-600 to-red-400"
                          style={{ height: `${Math.max((m.value / max) * 60, 4)}px` }} />
                      </div>
                      <span className="text-slate-500" style={{ fontSize: "9px" }}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><User size={11} className="text-red-600"/> Account Details</p>
            {[
              { label: "Account No.", value: customer.accountNumber, Icon: Hash },
              { label: "CCA No.",     value: customer.ccaNumber,     Icon: ShieldCheck },
              { label: "Phone",       value: customer.phone,         Icon: Phone },
              { label: "Location",    value: customer.location || "—", Icon: MapPin },
              { label: "Since",       value: formatDate(customer.created_at), Icon: Calendar },
              { label: "Last Load",   value: customer.lastLoadDate ? formatDate(customer.lastLoadDate) : "No record", Icon: Tv },
              { label: "Status",      value: actStatus, Icon: Banknote },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5"><f.Icon size={10} className="text-slate-300"/><p className="text-xs text-slate-400">{f.label}</p></div>
                <p className="text-xs font-semibold text-slate-800 text-right">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
