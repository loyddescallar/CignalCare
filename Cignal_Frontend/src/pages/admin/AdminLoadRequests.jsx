import { useState, useEffect, useMemo } from "react";
import { Search, X, Eye, CheckCircle2, XCircle } from "lucide-react";
import loadRequestApi from "../../api/loadRequestApi";

const STATUSES = ["Received", "Under Review", "Attending", "Completed", "Rejected"];

const statusCfg = {
  Received:      { badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  "Under Review":{ badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  Attending:     { badge: "bg-purple-100 text-purple-700",dot: "bg-purple-500" },
  Completed:     { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  Rejected:      { badge: "bg-red-100 text-red-700",     dot: "bg-red-500" },
};

export default function AdminLoadRequests() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [selected, setSelected]   = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await loadRequestApi.getAllLoadRequests();
      setRequests(res.data?.requests || res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests
      .filter(r => statusFilter === "All" || r.status === statusFilter)
      .filter(r =>
        r.account_name?.toLowerCase().includes(q) ||
        r.account_number?.toLowerCase().includes(q) ||
        r.reference_no?.toLowerCase().includes(q)
      );
  }, [requests, search, statusFilter]);

  const kpis = [
    { label: "Total",        value: requests.length,                                          dot: "bg-slate-400",   color: "text-slate-800" },
    { label: "Received",     value: requests.filter(r => r.status === "Received").length,      dot: "bg-blue-500",   color: "text-blue-600" },
    { label: "Under Review", value: requests.filter(r => r.status === "Under Review").length,  dot: "bg-amber-400",  color: "text-amber-600" },
    { label: "Completed",    value: requests.filter(r => r.status === "Completed").length,     dot: "bg-green-500",  color: "text-green-600" },
  ];

  const openModal = (r) => {
    setSelected(r);
    setNewStatus(r.status);
    setAdminNote(r.admin_note || "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await loadRequestApi.updateLoadStatus(selected.id, newStatus, adminNote);
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, status: newStatus, admin_note: adminNote } : r));
      setSelected(null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Load Requests</h1>
        <p className="text-xs text-slate-500 mt-0.5">Remote prepaid load requests submitted by subscribers</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 rounded-full ${s.dot}`} /><p className="text-xs text-slate-500">{s.label}</p></div>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1 max-w-xs">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Search name, account, reference..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-full" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...STATUSES].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                  statusFilter === s ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{s}</button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["#","Account Name","Account No.","Plan","Amount","Payment","Reference","Status","Date","Actions"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-semibold uppercase tracking-wide" style={{ fontSize: "10px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-10 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-10 text-center text-slate-400">No load requests found.</td></tr>
              ) : filtered.map(r => {
                const s = statusCfg[r.status] || statusCfg["Received"];
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                    <td className="py-2 px-3 font-mono text-slate-400">{r.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{r.account_name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{r.account_number}</td>
                    <td className="py-2 px-3 text-slate-600">{r.plan_name}</td>
                    <td className="py-2 px-3 font-semibold text-red-600">₱{Number(r.amount).toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-500">{r.payment_method}</td>
                    <td className="py-2 px-3 font-mono text-slate-400" style={{ fontSize: "10px" }}>{r.reference_no}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>{r.status}</span></td>
                    <td className="py-2 px-3 text-slate-400">{(r.created_at || "").split("T")[0].split(" ")[0]}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => openModal(r)}
                        className="text-xs px-3 py-1 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold">Review</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Review Load Request #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Account Name",  value: selected.account_name },
                  { label: "Account No.",   value: selected.account_number },
                  { label: "Plan",          value: selected.plan_name },
                  { label: "Amount",        value: `₱${Number(selected.amount).toLocaleString()}` },
                  { label: "Payment",       value: selected.payment_method },
                  { label: "Reference No.", value: selected.reference_no },
                ].map(f => (
                  <div key={f.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-slate-400 font-semibold" style={{ fontSize: "10px" }}>{f.label}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{f.value}</p>
                  </div>
                ))}
              </div>
              {selected.receipt_photo && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1" style={{ fontSize: "10px" }}>RECEIPT PHOTO</p>
                  <img src={selected.receipt_photo} alt="Receipt" className="w-full max-h-48 object-contain rounded-xl border border-slate-200" />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1" style={{ fontSize: "10px" }}>Update Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1" style={{ fontSize: "10px" }}>Admin Note</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} placeholder="Optional note to subscriber..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2.5 rounded-xl font-semibold disabled:opacity-60">
                  {saving ? "Saving..." : "Update Request"}
                </button>
                <button onClick={() => setSelected(null)} className="flex-1 border border-slate-200 text-xs py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
