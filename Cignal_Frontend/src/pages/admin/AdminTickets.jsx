import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search, MessageSquare, Trash2, ChevronDown, X } from "lucide-react";
import ticketApi from "../../api/ticketApi";

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const statusCfg = {
  Open:          { badge: "bg-red-100 text-red-700",    dot: "bg-red-500" },
  "In Progress": { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  Resolved:      { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  Closed:        { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};
const priorityCfg = { Low: "bg-slate-100 text-slate-600", Normal: "bg-blue-100 text-blue-600", High: "bg-orange-100 text-orange-600", Urgent: "bg-red-100 text-red-700" };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

export default function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [updating, setUpdating]   = useState(null);
  const [deleteTarget, setDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const res = await ticketApi.getAdminTickets(); setTickets(res.data?.tickets || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const supportTickets = tickets.filter(t => t.category !== "Technician Request");
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return supportTickets
      .filter(t => statusFilter === "All" || t.status === statusFilter)
      .filter(t => t.subject?.toLowerCase().includes(q) || String(t.id).includes(q) || t.category?.toLowerCase().includes(q));
  }, [supportTickets, search, statusFilter]);

  const kpis = [
    { label: "Total",       value: supportTickets.length,                                                          dot: "bg-slate-400", color: "text-slate-800" },
    { label: "Open",        value: supportTickets.filter(t => t.status === "Open").length,                          dot: "bg-red-500",   color: "text-red-600" },
    { label: "In Progress", value: supportTickets.filter(t => t.status === "In Progress").length,                   dot: "bg-amber-400", color: "text-amber-600" },
    { label: "Resolved",    value: supportTickets.filter(t => ["Resolved","Closed"].includes(t.status)).length,    dot: "bg-green-500", color: "text-green-600" },
  ];

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try { await ticketApi.updateTicketStatus(id, status); setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t)); }
    catch (err) { console.error(err); } finally { setUpdating(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await ticketApi.deleteTicket(deleteTarget.id); setTickets(prev => prev.filter(t => t.id !== deleteTarget.id)); setDelete(null); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-lg font-bold text-slate-800">Tickets</h1>
        <p className="text-xs text-slate-500 mt-0.5">Support tickets submitted by subscribers</p>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(s => (
          <motion.div key={s.label} variants={fadeUp} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 rounded-full ${s.dot}`} /><p className="text-xs text-slate-500">{s.label}</p></div>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1 max-w-xs">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Search subject, ID, category..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-full" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...STATUSES].map(s => (
              <motion.button key={s} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setStatus(s)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                  statusFilter === s ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{s}</motion.button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50">{["ID","Subject","Category","Priority","Status","Date","Actions"].map(h => (<th key={h} className="text-left py-2.5 px-3 text-slate-500 font-semibold uppercase tracking-wide" style={{ fontSize: "10px" }}>{h}</th>))}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-10 text-center text-slate-400">Loading tickets...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-slate-400">No tickets found.</td></tr>
              : filtered.map((t, i) => {
                const s = statusCfg[t.status] || statusCfg["Open"];
                return (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                    <td className="py-2 px-3 font-mono text-slate-400">#{t.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 max-w-[180px] truncate">{t.subject}</td>
                    <td className="py-2 px-3 text-slate-500">{t.category}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityCfg[t.priority] || "bg-slate-100 text-slate-600"}`}>{t.priority}</span></td>
                    <td className="py-2 px-3">
                      <div className="relative inline-block">
                        <select value={t.status} disabled={updating === t.id} onChange={e => handleStatusChange(t.id, e.target.value)}
                          className={`text-xs pl-2 pr-5 py-1 rounded-xl font-semibold border-0 outline-none cursor-pointer appearance-none ${s.badge}`}>
                          {STATUSES.map(st => <option key={st}>{st}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{(t.created_at || "").split(" ")[0]}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/admin/chat/${t.id}`)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Chat"><MessageSquare size={13} /></button>
                        <button onClick={() => setDelete(t)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Delete Ticket</h2>
              <button onClick={() => setDelete(null)} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">Delete ticket <span className="font-semibold">#{deleteTarget.id}</span> — "{deleteTarget.subject}"?</p>
              <div className="flex gap-2 mt-4">
                <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2.5 rounded-xl font-semibold">Delete</button>
                <button onClick={() => setDelete(null)} className="flex-1 border border-slate-200 text-xs py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
