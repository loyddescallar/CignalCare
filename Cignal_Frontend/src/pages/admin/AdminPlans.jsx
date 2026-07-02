import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, CheckCircle2, XCircle } from "lucide-react";
import prepaidApi from "../../api/prepaidApi";

const EMPTY_FORM = { plan_name: "", amount: "", validity_days: "30", benefits_text: "", status: "active" };

export default function AdminPlans() {
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [formError, setError]   = useState("");
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await prepaidApi.getPlans();
      setPlans(res.data?.plans || []);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openModal = (m, p = null) => {
    setMode(m); setSelected(p); setError("");
    if (m === "edit" && p) setForm({ plan_name: p.plan_name, amount: p.amount, validity_days: p.validity_days || 30, benefits_text: p.benefits_text || "", status: p.status || "active" });
    else if (m === "add") setForm({ ...EMPTY_FORM });
  };
  const close = () => { setMode(null); setSelected(null); setError(""); };
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const activePlans   = plans.filter(p => p.status === "active");
  const inactivePlans = plans.filter(p => p.status !== "active");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Prepaid Plans</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage available Cignal prepaid load packages</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Plans",    value: plans.length,         color: "text-slate-800" },
          { label: "Active Plans",   value: activePlans.length,   color: "text-green-600" },
          { label: "Inactive Plans", value: inactivePlans.length, color: "text-slate-400" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      {/* Plans Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Available Plans</h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No plans found. Check prepaid_plans table in database.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {plans.map(p => (
              <div key={p.id} className={`rounded-xl border p-4 relative ${
                p.status === "active" ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.plan_name}</p>
                    <p className="text-xs text-red-600 font-bold mt-0.5">₱{Number(p.amount).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>{p.status}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{p.validity_days || 30} days validity</p>
                {p.hd_channels > 0 && <p className="text-slate-400" style={{ fontSize: "10px" }}>{p.hd_channels} HD · {p.sd_channels} SD channels</p>}
                {p.benefits_text && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.benefits_text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
