import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, X, Users, MapPin, ExternalLink, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import customerApi from "../../api/customerApi";

const LOCATIONS = ["Balayan", "Calaca", "Lian", "Calatagan", "Nasugbu", "Lemery"];

function getActivityStatus(lastLoadDate) {
  if (!lastLoadDate) return "Inactive";
  const days = (Date.now() - new Date(lastLoadDate).getTime()) / 86400000;
  if (days <= 30) return "Active";
  if (days <= 60) return "At Risk";
  return "Inactive";
}

const activityStyle = {
  Active:    { badge: "bg-green-100 text-green-700",  dot: "bg-green-500",  icon: <CheckCircle2 size={10} className="text-green-600" /> },
  "At Risk": { badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400",  icon: <AlertTriangle size={10} className="text-amber-500" /> },
  Inactive:  { badge: "bg-gray-100 text-gray-600",    dot: "bg-gray-400",   icon: <XCircle size={10} className="text-gray-400" /> },
};

const EMPTY_FORM = { accountName: "", accountNumber: "", ccaNumber: "", address: "", phone: "", location: "Balayan" };

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers]     = useState([]);
  const [stats, setStats]             = useState({ total: 0, thisMonth: 0, activeCount: 0, atRiskCount: 0, inactiveCount: 0 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [locationTab, setLocationTab] = useState("All");
  const [ccaQuery, setCcaQuery]       = useState("");
  const [ccaResult, setCcaResult]     = useState(null);
  const [mode, setMode]               = useState(null);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [formError, setFormError]     = useState("");
  const [saving, setSaving]           = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, statsRes] = await Promise.all([customerApi.getCustomers(), customerApi.getStats()]);
      setCustomers(custRes.data?.customers || []);
      setStats(statsRes.data?.stats || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const byLocation = locationTab === "All" ? customers : customers.filter(c => c.location === locationTab);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return byLocation.filter(c =>
      c.accountName?.toLowerCase().includes(q) || c.accountNumber?.toLowerCase().includes(q) ||
      c.ccaNumber?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q)
    );
  }, [byLocation, search]);

  const openModal = (m, c = null) => {
    setMode(m); setSelected(c); setFormError("");
    if (m === "edit" && c) setForm({ accountName: c.accountName, accountNumber: c.accountNumber, ccaNumber: c.ccaNumber, address: c.address || "", phone: c.phone || "", location: c.location || "Balayan" });
    else if (m === "add") setForm({ ...EMPTY_FORM });
  };
  const closeModal = () => { setMode(null); setSelected(null); setFormError(""); };
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAdd = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.ccaNumber.trim()) { setFormError("Account name, account number, and CCA number are required."); return; }
    setSaving(true);
    try { await customerApi.createCustomer(form); closeModal(); loadData(); }
    catch (err) { setFormError(err.response?.data?.error || "Failed to save."); }
    finally { setSaving(false); }
  };
  const handleEdit = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.ccaNumber.trim()) { setFormError("Account name, account number, and CCA number are required."); return; }
    setSaving(true);
    try { await customerApi.updateCustomer(selected.id, form); closeModal(); loadData(); }
    catch (err) { setFormError(err.response?.data?.error || "Failed to update."); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    setSaving(true);
    try { await customerApi.deleteCustomer(selected.id); closeModal(); loadData(); }
    catch (err) { setFormError(err.response?.data?.error || "Failed to delete."); }
    finally { setSaving(false); }
  };
  const handleCcaSearch = (e) => {
    e.preventDefault();
    const q = ccaQuery.trim();
    if (!q) return;
    const found = customers.find(c => c.accountNumber === q || c.ccaNumber === q);
    setCcaResult(found || "not-found");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-slate-800">Customers</h1><p className="text-xs text-slate-500 mt-0.5">Registered Descallar Satellite Services accounts</p></div>
        <button onClick={() => openModal("add")} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl font-semibold"><Plus size={14} /> Add Customer</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Customers",       value: loading ? "..." : (stats.total ?? customers.length), color: "text-slate-800",  icon: <Users size={15} className="text-slate-400" /> },
          { label: "Registered This Month", value: loading ? "..." : (stats.thisMonth ?? 0),            color: "text-blue-600",   icon: <Users size={15} className="text-blue-400" /> },
          { label: "Active Accounts",       value: loading ? "..." : (stats.activeCount ?? 0),          color: "text-green-600",  icon: <CheckCircle2 size={15} className="text-green-500" /> },
          { label: "At Risk",               value: loading ? "..." : (stats.atRiskCount ?? 0),          color: "text-amber-600",  icon: <AlertTriangle size={15} className="text-amber-500" /> },
          { label: "Inactive Accounts",     value: loading ? "..." : (stats.inactiveCount ?? 0),        color: "text-slate-500",  icon: <XCircle size={15} className="text-slate-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-xs text-slate-500 leading-tight">{s.label}</p></div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Search size={15} className="text-red-600" /></div>
          <div><h2 className="text-sm font-semibold text-slate-700">CCA / Account Inquiry</h2><p className="text-xs text-slate-400">Look up a subscriber by Account Number or CCA Number</p></div>
        </div>
        <form onSubmit={handleCcaSearch} className="flex gap-2 max-w-lg">
          <input type="text" value={ccaQuery} onChange={e => { setCcaQuery(e.target.value); if (!e.target.value) setCcaResult(null); }} placeholder="e.g. 88773322 or CCA-1002"
            className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-red-500" />
          <button type="submit" className="bg-red-600 text-white text-xs px-5 py-2.5 rounded-xl hover:bg-red-700 font-semibold">Search</button>
        </form>
        {ccaResult === "not-found" && <div className="mt-2.5 text-xs px-3 py-2.5 rounded-xl max-w-lg bg-red-50 text-red-600 border border-red-100">❌ No record found for "{ccaQuery}"</div>}
        {ccaResult && ccaResult !== "not-found" && (() => {
          const s = getActivityStatus(ccaResult.lastLoadDate);
          return (
            <div className="mt-2.5 max-w-lg bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-xs text-green-700 font-semibold mb-2">✅ Record Found</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[{label:"Account Name",value:ccaResult.accountName},{label:"Account No.",value:ccaResult.accountNumber},{label:"CCA No.",value:ccaResult.ccaNumber},{label:"Phone",value:ccaResult.phone},{label:"Location",value:ccaResult.location||"—"},{label:"Registered",value:new Date(ccaResult.created_at).toLocaleDateString("en-PH")}].map(f=>(
                  <div key={f.label}><span className="text-slate-400" style={{fontSize:"9px"}}>{f.label}</span><p className="text-xs text-slate-800 font-medium">{f.value}</p></div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activityStyle[s].badge}`}>{activityStyle[s].icon} {s}</span>
                <button onClick={() => navigate(`/admin/customers/${ccaResult.id}`)} className="flex items-center gap-1 text-xs text-red-600 hover:underline"><ExternalLink size={11} /> View Full Profile</button>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1 max-w-xs">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Search name, account, CCA, phone..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-full" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All",...LOCATIONS].map(loc=>(
              <button key={loc} onClick={()=>setLocationTab(loc)} className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors ${locationTab===loc?"bg-red-600 text-white":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {loc}{loc!=="All"&&<span className={`ml-1 ${locationTab===loc?"text-red-200":"text-slate-400"}`}>({customers.filter(c=>c.location===loc).length})</span>}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">Showing {filtered.length} of {byLocation.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50">{["Account Name","Account No.","CCA No.","Phone","Location","Status","Registered","Actions"].map(h=>(<th key={h} className="text-left py-2.5 px-3 text-slate-500 font-semibold uppercase tracking-wide" style={{fontSize:"10px"}}>{h}</th>))}</tr></thead>
            <tbody>
              {loading?(<tr><td colSpan={8} className="py-10 text-center text-slate-400">Loading...</td></tr>)
              :filtered.length===0?(<tr><td colSpan={8} className="py-10 text-center text-slate-400">No customers found.</td></tr>)
              :filtered.map(c=>{
                const s=getActivityStatus(c.lastLoadDate);
                return(
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                    <td className="py-2 px-3 font-semibold text-slate-800">{c.accountName}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{c.accountNumber}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{c.ccaNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{c.phone}</td>
                    <td className="py-2 px-3"><div className="flex items-center gap-1"><MapPin size={10} className="text-slate-400"/><span className="text-slate-500">{c.location||"—"}</span></div></td>
                    <td className="py-2 px-3"><div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full flex-shrink-0 ${activityStyle[s].dot}`}/><span className={`px-2 py-0.5 rounded text-xs font-semibold ${activityStyle[s].badge}`}>{s}</span></div></td>
                    <td className="py-2 px-3 text-slate-400">{new Date(c.created_at).toLocaleDateString("en-PH")}</td>
                    <td className="py-2 px-3"><div className="flex items-center gap-2">
                      <button onClick={()=>navigate(`/admin/customers/${c.id}`)} className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50" title="View"><ExternalLink size={13}/></button>
                      <button onClick={()=>openModal("edit",c)} className="text-amber-500 hover:text-amber-700 p-1 rounded hover:bg-amber-50" title="Edit"><Pencil size={13}/></button>
                      <button onClick={()=>openModal("delete",c)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Delete"><Trash2 size={13}/></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {(mode==="add"||mode==="edit")&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-800">{mode==="add"?"Add New Customer":`Edit — ${selected?.accountName}`}</h2><button onClick={closeModal} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"><X size={16}/></button></div>
            <div className="p-5 max-h-[80vh] overflow-y-auto">
              {formError&&<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Account Name *",name:"accountName"},{label:"Account Number *",name:"accountNumber"},{label:"CCA Number *",name:"ccaNumber"},{label:"Phone",name:"phone"}].map(f=>(
                  <div key={f.name}><label className="block text-xs text-slate-500 font-medium mb-1" style={{fontSize:"10px"}}>{f.label}</label><input name={f.name} value={form[f.name]} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500"/></div>
                ))}
                <div className="col-span-2"><label className="block text-xs text-slate-500 font-medium mb-1" style={{fontSize:"10px"}}>Address</label><input name="address" value={form.address} onChange={handleChange} placeholder="e.g. Brgy. Caloocan, Balayan, Batangas" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500"/></div>
                <div className="col-span-2"><label className="block text-xs text-slate-500 font-medium mb-1" style={{fontSize:"10px"}}>Coverage Location *</label><select name="location" value={form.location} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500">{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={mode==="add"?handleAdd:handleEdit} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2.5 rounded-xl font-semibold disabled:opacity-60">{saving?"Saving...":mode==="add"?"Save Customer":"Update Customer"}</button>
                <button onClick={closeModal} className="flex-1 border border-slate-200 text-xs py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {mode==="delete"&&selected&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-800">Delete Customer</h2><button onClick={closeModal} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"><X size={16}/></button></div>
            <div className="p-5"><p className="text-xs text-slate-600 leading-relaxed">Delete <span className="font-semibold">{selected.accountName}</span> ({selected.accountNumber})? This cannot be undone.</p>
              <div className="flex gap-2 mt-4"><button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2.5 rounded-xl font-semibold disabled:opacity-60">{saving?"Deleting...":"Delete"}</button><button onClick={closeModal} className="flex-1 border border-slate-200 text-xs py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
