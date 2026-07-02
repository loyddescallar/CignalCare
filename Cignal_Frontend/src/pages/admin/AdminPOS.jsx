import { useState, useEffect, useMemo } from "react";
import { Search, CreditCard, CheckCircle2 } from "lucide-react";
import customerApi from "../../api/customerApi";
import prepaidApi from "../../api/prepaidApi";
import loadAdminApi from "../../api/loadAdminApi";

const PAYMENT_METHODS = ["Cash", "GCash", "Maya", "Bank Transfer"];

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
          prepaidApi.getPlans().catch(() => ({ data: { plans: [] } })),
          loadAdminApi.getAll().catch(() => ({ data: { history: [] } })),
        ]);
        setCustomers(cRes.data?.customers || []);
        setPlans(pRes.data?.plans || []);
        setHistory(hRes.data?.history || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayLoads   = history.filter(h => (h.created_at || "").startsWith(today));
  const totalRevenue = history.reduce((s, h) => s + Number(h.loadAmount || 0), 0);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = ccaQuery.trim();
    if (!q) return;
    const found = customers.find(c => c.accountNumber === q || c.ccaNumber === q);
    setFound(found || null);
    setNotFound(!found);
    setPlan(null);
    setSuccess(null);
  };

  const handleProcess = async () => {
    if (!foundCustomer || !selectedPlan) return;
    setProcessing(true);
    try {
      await loadAdminApi.create({
        accountNumber: foundCustomer.accountNumber,
        accountName: foundCustomer.accountName,
        loadAmount: selectedPlan.amount,
        planName: selectedPlan.plan_name,
        paymentMethod: payMethod,
        description: `POS Load — ${selectedPlan.plan_name}`,
      });
      setSuccess({ customer: foundCustomer.accountName, plan: selectedPlan.plan_name, amount: selectedPlan.amount });
      setFound(null); setPlan(null); setCcaQuery(""); setNotFound(false);
      const hRes = await loadAdminApi.getAll();
      setHistory(hRes.data?.history || []);
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  };

  const activePlans = plans.filter(p => p.status === "active" || !p.status);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">POS / Prepaid</h1>
        <p className="text-xs text-slate-500 mt-0.5">Process prepaid load transactions for subscribers</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Loads Today",      value: loading ? "..." : todayLoads.length,                     color: "text-blue-600" },
          { label: "Total Transactions",value: loading ? "..." : history.length,                        color: "text-slate-800" },
          { label: "Total Revenue",     value: loading ? "..." : `₱${totalRevenue.toLocaleString()}`,   color: "text-green-600" },
          { label: "Available Plans",   value: loading ? "..." : activePlans.length,                    color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* POS Terminal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Load Terminal</h2>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-700">Load Successful!</p>
                <p className="text-xs text-green-600 mt-0.5">{success.customer} — {success.plan} (₱{Number(success.amount).toLocaleString()})</p>
              </div>
            </div>
          )}

          {/* Step 1: Find Customer */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2" style={{ fontSize: "10px" }}>STEP 1 — FIND SUBSCRIBER</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input type="text" value={ccaQuery} onChange={e => { setCcaQuery(e.target.value); setNotFound(false); setFound(null); }}
                placeholder="Account No. or CCA No."
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500" />
              <button type="submit" className="bg-red-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-red-700 font-semibold">Search</button>
            </form>
            {notFound && <p className="text-xs text-red-600 mt-1.5">❌ No subscriber found for "{ccaQuery}"</p>}
            {foundCustomer && (
              <div className="mt-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-green-700">✅ {foundCustomer.accountName}</p>
                <p className="text-xs text-green-600 font-mono">{foundCustomer.accountNumber} · {foundCustomer.location}</p>
              </div>
            )}
          </div>

          {/* Step 2: Select Plan */}
          {foundCustomer && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2" style={{ fontSize: "10px" }}>STEP 2 — SELECT PLAN</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {activePlans.length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-4">No plans available. Check prepaid_plans table.</p>
                ) : activePlans.map(p => (
                  <button key={p.id} onClick={() => setPlan(p)}
                    className={`text-left p-2.5 rounded-xl border transition-colors ${
                      selectedPlan?.id === p.id ? "border-red-600 bg-red-50" : "border-slate-200 hover:border-red-300"
                    }`}>
                    <p className="text-xs font-bold text-slate-800">{p.plan_name}</p>
                    <p className="text-xs text-red-600 font-semibold">₱{Number(p.amount).toLocaleString()}</p>
                    <p className="text-slate-400" style={{ fontSize: "10px" }}>{p.validity_days || 30} days</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {foundCustomer && selectedPlan && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2" style={{ fontSize: "10px" }}>STEP 3 — PAYMENT METHOD</p>
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                      payMethod === m ? "bg-red-600 text-white border-red-600" : "border-slate-200 text-slate-600 hover:border-red-300"
                    }`}>{m}</button>
                ))}
              </div>
            </div>
          )}

          {/* Summary + Process */}
          {foundCustomer && selectedPlan && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Subscriber</span>
                <span className="font-semibold text-slate-800">{foundCustomer.accountName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Plan</span>
                <span className="font-semibold text-slate-800">{selectedPlan.plan_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-red-600">₱{Number(selectedPlan.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold text-slate-800">{payMethod}</span>
              </div>
              <button onClick={handleProcess} disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-3 rounded-xl font-bold transition-colors disabled:opacity-60 mt-2">
                {processing ? "Processing..." : `Process ₱${Number(selectedPlan.amount).toLocaleString()} Load`}
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No transactions yet.</div>
            ) : history.slice(0, 20).map((h, i) => (
              <div key={i} className="px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{h.accountNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{h.description || "Prepaid Load"}</p>
                    <p className="text-slate-400 mt-0.5" style={{ fontSize: "10px" }}>{(h.created_at || "").split(" ")[0]}</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">₱{Number(h.loadAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
