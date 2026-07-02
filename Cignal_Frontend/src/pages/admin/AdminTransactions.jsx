import { useState, useEffect, useMemo } from "react";
import { Search, Download } from "lucide-react";
import loadAdminApi from "../../api/loadAdminApi";

export default function AdminTransactions() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await loadAdminApi.getAll();
        setHistory(res.data?.history || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return history.filter(h =>
      h.accountNumber?.toLowerCase().includes(q) ||
      (h.description || "").toLowerCase().includes(q)
    );
  }, [history, search]);

  const totalRevenue   = history.reduce((s, h) => s + Number(h.loadAmount || 0), 0);
  const today          = new Date().toISOString().split("T")[0];
  const todayRevenue   = history.filter(h => (h.created_at || "").startsWith(today)).reduce((s, h) => s + Number(h.loadAmount || 0), 0);

  const handleExport = () => {
    const rows = [["ID","Account Number","Amount","Description","Status","Date"]];
    history.forEach(h => rows.push([h.id, h.accountNumber, h.loadAmount, h.description || "", h.status, (h.created_at||"").split(" ")[0]]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `transactions_${today}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Transactions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Prepaid load transaction history</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 border border-slate-200 text-xs px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Transactions", value: loading ? "..." : history.length,                              color: "text-slate-800" },
          { label: "Today's Revenue",    value: loading ? "..." : `₱${todayRevenue.toLocaleString()}`,          color: "text-blue-600" },
          { label: "Total Revenue",      value: loading ? "..." : `₱${totalRevenue.toLocaleString()}`,          color: "text-green-600" },
          { label: "Avg. Load Amount",   value: loading ? "..." : history.length ? `₱${Math.round(totalRevenue / history.length).toLocaleString()}` : "₱0", color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1 max-w-xs">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Search account number or description..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-full" />
          </div>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["#","Account Number","Amount","Description","Status","Date"].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-slate-500 font-semibold uppercase tracking-wide" style={{ fontSize: "10px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">No transactions found.</td></tr>
              ) : filtered.map((h, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                  <td className="py-2 px-3 font-mono text-slate-400">{h.id}</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{h.accountNumber}</td>
                  <td className="py-2 px-3 font-bold text-red-600">₱{Number(h.loadAmount || 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-600">{h.description || "Prepaid Load"}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      h.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>{h.status || "completed"}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">{(h.created_at || "").split(" ")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
