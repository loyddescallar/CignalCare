import { useState, useEffect } from "react";
import { CheckCircle2, X, Copy, Check } from "lucide-react";
import customerApi from "../../api/customerApi";
import loadAdminApi from "../../api/loadAdminApi";
import axiosClient from "../../api/axiosClient";

const PAYMENT_METHODS = ["Cash", "GCash", "Maya", "Bank Transfer"];

const GCASH_ACCOUNT  = { name: "Descallar Satellite Services", number: "09755718056" };
const MAYA_ACCOUNT   = { name: "Descallar Satellite Services", number: "09755718056" };

export default function AdminPOS() {
  const [customers, setCustomers]   = useState([]);
  const [plans, setPlans]           = useState([]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [txFilter, setTxFilter]     = useState("All");
  const [ccaQuery, setCcaQuery]     = useState("");
  const [foundCustomer, setFound]   = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [selectedPlan, setPlan]     = useState(null);
  const [payMethod, setPayMethod]   = useState("Cash");
  const [cashTendered, setCash]     = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState(null);
  const [qrModal, setQrModal]       = useState(false);
  const [copied, setCopied]         = useState("");

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
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const today        = new Date().toISOString().split("T")[0];
  const todayLoads   = history.filter(h => (h.created_at || "").startsWith(today));
  const totalRevenue = history.reduce((s, h) => s + Number(h.loadAmount || 0), 0);

  const displayedHistory = txFilter === "Today"
    ? history.filter(h => (h.created_at || "").startsWith(today))
    : history;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = ccaQuery.trim();
    if (!q) return;
    const found = customers.find(c => c.accountNumber === q || c.ccaNumber === q);
    setFound(found || null); setNotFound(!found); setPlan(null); setSuccess(null);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const handleProcess = async () => {
    if (!foundCustomer || !selectedPlan) return;
    setProcessing(true);
    try {
      await loadAdminApi.create({
        accountNumber: foundCustomer.accountNumber,
        loadAmount: selectedPlan.amount,
        description: `POS Load — ${selectedPlan.plan_name} via ${payMethod}`,
      });
      setSuccess({ customer: foundCustomer.accountName, plan: selectedPlan.plan_name, amount: selectedPlan.amount });
      setFound(null); setPlan(null); setCcaQuery(""); setNotFound(false); setCash(""); setQrModal(false);
      const hRes = await loadAdminApi.getAll();
      setHistory(hRes.data?.history || []);
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  };

  const payAccount = payMethod === "GCash" ? GCASH_ACCOUNT : MAYA_ACCOUNT;
  const change = cashTendered && selectedPlan ? Math.max(0, Number(cashTendered) - Number(selectedPlan.amount)) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">POS / Prepaid</h1>
        <p className="text-xs text-slate-500 mt-0.5">Process prepaid load transactions for subscribers</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Loads Today",       value: loading ? "..." : todayLoads.length,                   color: "text-blue-600" },
          { label: "Total Transactions", value: loading ? "..." : history.length,                      color: "text-slate-800" },
          { label: "Total Revenue",      value: loading ? "..." : `₱${totalRevenue.toLocaleString()}`, color: "text-green-600" },
          { label: "Available Plans",    value: loading ? "..." : plans.length,                        color: "text-red-600" },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Load Terminal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Load Terminal</h2>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-700">Load Submitted!</p>
                <p className="text-xs text-green-600 mt-0.5">{success.customer} — {success.plan} (₱{Number(success.amount).toLocaleString()})</p>
              </div>
            </div>
          )}

          {/* Step 1 */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontSize: "10px" }}>STEP 1 — FIND SUBSCRIBER</p>
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

          {/* Step 2 */}
          {foundCustomer && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontSize: "10px" }}>STEP 2 — SELECT PLAN</p>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                {plans.length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-4">No active plans in database.</p>
                ) : plans.map(p => (
                  <button key={p.id} onClick={() => setPlan(p)}
                    className={`text-left p-2.5 rounded-xl border transition-colors ${
                      selectedPlan?.id === p.id ? "border-red-600 bg-red-50" : "border-slate-200 hover:border-red-300"}`}>
                    <p className="text-xs font-bold text-slate-800">{p.plan_name}</p>
                    <p className="text-xs text-red-600 font-semibold">₱{Number(p.amount).toLocaleString()}</p>
                    <p className="text-slate-400" style={{ fontSize: "10px" }}>{p.validity_days} days · {p.hd_channels}HD/{p.sd_channels}SD</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {foundCustomer && selectedPlan && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2" style={{ fontSize: "10px" }}>STEP 3 — PAYMENT METHOD</p>
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => { setPayMethod(m); setCash(""); setQrModal(false); }}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                      payMethod === m ? "bg-red-600 text-white border-red-600" : "border-slate-200 text-slate-600 hover:border-red-300"}`}>{m}</button>
                ))}
              </div>

              {/* Cash: amount tendered */}
              {payMethod === "Cash" && (
                <div className="mt-3">
                  <label className="block text-xs text-slate-500 font-medium mb-1" style={{ fontSize: "10px" }}>AMOUNT TENDERED</label>
                  <input type="number" value={cashTendered} onChange={e => setCash(e.target.value)}
                    placeholder={`₱${Number(selectedPlan.amount).toLocaleString()}`}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500" />
                  {cashTendered && Number(cashTendered) >= Number(selectedPlan.amount) && (
                    <p className="text-xs text-green-600 mt-1 font-semibold">Change: ₱{change.toLocaleString()}</p>
                  )}
                  {cashTendered && Number(cashTendered) < Number(selectedPlan.amount) && (
                    <p className="text-xs text-red-600 mt-1">Short by ₱{(Number(selectedPlan.amount) - Number(cashTendered)).toLocaleString()}</p>
                  )}
                </div>
              )}

              {/* GCash / Maya: QR Code button */}
              {(payMethod === "GCash" || payMethod === "Maya") && (
                <button onClick={() => setQrModal(true)}
                  className={`mt-3 w-full text-xs py-2 rounded-xl font-semibold border transition-colors ${
                    payMethod === "GCash" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}>
                  Show {payMethod} QR Code & Account Details
                </button>
              )}
            </div>
          )}

          {/* Summary + Process */}
          {foundCustomer && selectedPlan && (
            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              {[
                { label: "Subscriber", value: foundCustomer.accountName },
                { label: "Plan",       value: selectedPlan.plan_name },
                { label: "Amount",     value: `₱${Number(selectedPlan.amount).toLocaleString()}` },
                { label: "Payment",    value: payMethod },
              ].map(f => (
                <div key={f.label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{f.label}</span>
                  <span className={`font-semibold ${f.label === "Amount" ? "text-red-600" : "text-slate-800"}`}>{f.value}</span>
                </div>
              ))}
              <button onClick={handleProcess} disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-3 rounded-xl font-bold mt-2 disabled:opacity-60">
                {processing ? "Processing..." : `✔ Process ₱${Number(selectedPlan.amount).toLocaleString()} Load`}
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
            <div className="flex gap-1">
              {["Today","All"].map(f => (
                <button key={f} onClick={() => setTxFilter(f)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    txFilter === f ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            ) : displayedHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No transactions.</div>
            ) : displayedHistory.slice(0, 25).map((h, i) => (
              <div key={i} className="px-4 py-3 hover:bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{h.accountNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{h.description || "Prepaid Load"}</p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "10px" }}>{new Date(h.created_at).toLocaleDateString("en-PH")}</p>
                </div>
                <p className="text-sm font-bold text-red-600">₱{Number(h.loadAmount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className={`px-5 py-4 flex items-center justify-between ${
              payMethod === "GCash" ? "bg-blue-600" : "bg-emerald-600"} text-white`}>
              <h2 className="text-sm font-bold">{payMethod} Payment</h2>
              <button onClick={() => setQrModal(false)} className="p-1 rounded-xl hover:bg-white/20"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="w-40 h-40 border-4 border-slate-800 rounded-xl p-2 bg-white">
                  <div className="w-full h-full grid grid-cols-5 gap-0.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`rounded-sm ${
                        [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,6,12,18,7,13,11,17].includes(i)
                          ? "bg-slate-800" : "bg-white"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">Scan this QR code using {payMethod} app</p>

              <div className={`rounded-xl p-4 space-y-3 ${
                payMethod === "GCash" ? "bg-blue-50 border border-blue-100" : "bg-emerald-50 border border-emerald-100"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500" style={{ fontSize: "10px" }}>ACCOUNT NAME</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{payAccount.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500" style={{ fontSize: "10px" }}>{payMethod} NUMBER</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{payAccount.number}</p>
                  </div>
                  <button onClick={() => copyToClipboard(payAccount.number, "number")}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold ${
                      payMethod === "GCash" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {copied === "number" ? <Check size={12} /> : <Copy size={12} />}
                    {copied === "number" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <div>
                    <p className="text-xs text-slate-500" style={{ fontSize: "10px" }}>AMOUNT TO SEND</p>
                    <p className="text-lg font-bold text-red-600">₱{Number(selectedPlan.amount).toLocaleString()}</p>
                  </div>
                  <button onClick={() => copyToClipboard(String(selectedPlan.amount), "amount")}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold ${
                      payMethod === "GCash" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {copied === "amount" ? <Check size={12} /> : <Copy size={12} />}
                    {copied === "amount" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-center text-slate-400" style={{ fontSize: "10px" }}>After payment, click Process to record the transaction.</p>
              <button onClick={() => { setQrModal(false); handleProcess(); }}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2.5 rounded-xl font-bold">
                I've Paid — Process Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
