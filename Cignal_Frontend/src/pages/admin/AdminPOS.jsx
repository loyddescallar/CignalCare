import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import customerApi from "../../api/customerApi";
import loadAdminApi from "../../api/loadAdminApi";
import axiosClient from "../../api/axiosClient";

const PAYMENT_METHODS = ["Cash", "GCash", "Maya", "Bank Transfer"];
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

export default function AdminPOS() {
  const [customers, setCustomers]   = useState([]);
  const [plans, setPlans]           = useState([]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ccaQuery, setCcaQuery]     = useState("");
  const [foundCustomer, setFound]   = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [selectedPlan, setPlan]     = useState(null);
  const [payMethod, setPayMethod]   = useState("Cash");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cRes, pRes, hRes] = await Promise.all([
          customerApi.getCustomers(),
          axiosClient.get("/load/plans"),
          loadAdminApi.getAll(),
        ]);
        setCustomers(cRes.data?.customers || []);
        setPlans((pRes.data?.plans || []).filter(p => p.status === "active"));
        setHistory(hRes.data?.history || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    load();
  }, []);

  const today        = new Date().toISOString().split("T")[0];
  const todayLoads   = history.filter(h => (h.created_at || "").startsWith(today));
  const totalRevenue = history.reduce((s, h) => s + Number(h.loadAmount || 0), 0);

  const kpis = [
    { label: "Loads Today",       value: loading ? "..." : todayLoads.length },
    { label: "Total Transactions", value: loading ? "..." : history.length },
    { label: "Total Revenue",      value: loading ? "..." : `₱${totalRevenue.toLocaleString()}` },
    { label: "Available Plans",    value: loading ? "..." : plans.length },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const q = ccaQuery.trim();
    if (!q) return;
    const found = customers.find(c => c.accountNumber === q || c.ccaNumber === q);
    setFound(found || null); setNotFound(!found); setPlan(null); setSuccess(null);
  };

  const handleProcess = async () => {
    if (!foundCustomer || !selectedPlan) return;
    setProcessing(true);
    try {
      await loadAdminApi.create({ accountNumber: foundCustomer.accountNumber, loadAmount: selectedPlan.amount, description: `POS Load — ${selectedPlan.plan_name} via ${payMethod}` });
      setSuccess({ customer: foundCustomer.accountName, plan: selectedPlan.plan_name, amount: selectedPlan.amount });
      setFound(null); setPlan(null); setCcaQuery(""); setNotFound(false);
      const hRes = await loadAdminApi.getAll();
      setHistory(hRes.data?.history || []);
    } catch (err) { console.error(err); } finally { setProcessing(false); }
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-lg font-bold text-slate-800">POS / Prepaid</h1>
        <p className="text-xs text-slate-500 mt-0.5">Process prepaid load transactions for subscribers</p>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${i === 2 ? "text-green-600" : i === 3 ? "text-red-600" : "text-slate-800"}`}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Load Terminal</h2>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div><p className="text-xs font-semibold text-green-700">Load Submitted!</p>
                <p className="text-xs text-green-600 mt-0.5">{success.customer} — {success.plan} (₱{Number(success.amount).toLocaleString()})</p></div>
            </motion.div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontSize: "10px" }}>STEP 1 — FIND SUBSCRIBER</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input type="text" value={ccaQuery} onChange={e => { setCcaQuery(e.target.value); setNotFound(false); setFound(null); }}
                placeholder="Account No. or CCA No." className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500" />
              <button type="submit" className="bg-red-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-red-700 font-semibold">Search</button>
            </form>
            {notFound && <p className="text-xs text-red-600 mt-1.5">❌ No subscriber found for "{ccaQuery}"</p>}
            {foundCustomer && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-green-700">✅ {foundCustomer.accountName}</p>
                <p className="text-xs text-green-600 font-mono">{foundCustomer.accountNumber} · {foundCustomer.location}</p>
              </motion.div>
            )}
          </div>
          {foundCustomer && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontSize: "10px" }}>STEP 2 — SELECT PLAN</p>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                {plans.length === 0 ? <p className="text-xs text-slate-400 col-span-2 text-center py-4">No active plans in database.</p>
                : plans.map(p => (
                  <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setPlan(p)}
                    className={`text-left p-2.5 rounded-xl border transition-colors ${selectedPlan?.id === p.id ? "border-red-600 bg-red-50" : "border-slate-200 hover:border-red-300"}`}>
                    <p className="text-xs font-bold text-slate-800">{p.plan_name}</p>
                    <p className="text-xs text-red-600 font-semibold">₱{Number(p.amount).toLocaleString()}</p>
                    <p className="text-slate-400" style={{ fontSize: "10px" }}>{p.validity_days} days</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {foundCustomer && selectedPlan && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontSize: "10px" }}>STEP 3 — PAYMENT METHOD</p>
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_METHODS.map(m => (
                  <motion.button key={m} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setPayMethod(m)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${payMethod === m ? "bg-red-600 text-white border-red-600" : "border-slate-200 text-slate-600 hover:border-red-300"}`}>{m}</motion.button>
                ))}
              </div>
            </div>
          )}
          {foundCustomer && selectedPlan && (
            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              {[{label:"Subscriber",value:foundCustomer.accountName},{label:"Plan",value:selectedPlan.plan_name},{label:"Amount",value:`₱${Number(selectedPlan.amount).toLocaleString()}`},{label:"Payment",value:payMethod}].map(f=>(
                <div key={f.label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{f.label}</span>
                  <span className={`font-semibold ${f.label==="Amount"?"text-red-600":"text-slate-800"}`}>{f.value}</span>
                </div>
              ))}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleProcess} disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-3 rounded-xl font-bold mt-2 disabled:opacity-60">
                {processing ? "Processing..." : `Process ₱${Number(selectedPlan.amount).toLocaleString()} Load`}
              </motion.button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2></div>
          <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto">
            {loading ? <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            : history.length === 0 ? <div className="py-8 text-center text-xs text-slate-400">No transactions yet.</div>
            : history.slice(0, 20).map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03, duration: 0.2 }}
                className="px-4 py-3 hover:bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{h.accountNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{h.description || "Prepaid Load"}</p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "10px" }}>{(h.created_at || "").split(" ")[0]}</p>
                </div>
                <p className="text-sm font-bold text-red-600">₱{Number(h.loadAmount || 0).toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
