import { useState, useEffect } from "react";
import { X, Tv } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const CIGNAL_CHANNELS = {
  Entertainment: ["GMA", "ABS-CBN", "TV5", "ONE", "GTV", "A2Z", "PTV", "GMA Life TV", "Cignal Play"],
  News:          ["CNN Philippines", "One News", "GMA News TV", "DZMM TeleRadyo", "PTV News"],
  Sports:        ["One Sports", "ESPN5", "Cignal Sports", "Fox Sports Philippines", "One Sports+"],
  Movies:        ["CineMo", "Star Movies", "Cinema One", "Star Cinema Action", "Max (HBO)", "Cinemax"],
  Kids:          ["Cartoon Network", "Disney Channel", "Nickelodeon", "Nick Jr.", "Disney Junior"],
  Religious:     ["EWTN", "CBN Asia", "Net 25", "SMNI", "The 700 Club Asia"],
  Educational:   ["Discovery Channel", "National Geographic", "History Channel", "AXN", "NatGeo Wild"],
  Music:         ["MTV", "MYX", "2nd Avenue", "Myx HD"],
  Others:        ["Shop TV", "Balls Channel", "NBA TV"],
};

const ALL_CATEGORIES = Object.keys(CIGNAL_CHANNELS);

// Which categories are available per plan (cumulative by price)
const PLAN_CATEGORIES = {
  "Load 200":  ["Entertainment", "News", "Religious"],
  "Load 300":  ["Entertainment", "News", "Religious", "Kids", "Music"],
  "Load 450":  ["Entertainment", "News", "Religious", "Kids", "Music", "Educational"],
  "Load 500":  ["Entertainment", "News", "Religious", "Kids", "Music", "Educational", "Sports"],
  "Load 600":  ["Entertainment", "News", "Religious", "Kids", "Music", "Educational", "Sports", "Movies"],
  "Load 800":  ["Entertainment", "News", "Religious", "Kids", "Music", "Educational", "Sports", "Movies", "Others"],
  "Load 1000": ALL_CATEGORIES,
};

export default function AdminPlans() {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedPlan, setModal]  = useState(null);
  const [channelCat, setChannelCat] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await axiosClient.get("/load/plans");
        setPlans(res.data?.plans || []);
      } catch { setPlans([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const activePlans   = plans.filter(p => p.status === "active");
  const inactivePlans = plans.filter(p => p.status !== "active");

  const getPlanChannels = (planName) => {
    const categories = PLAN_CATEGORIES[planName] || ALL_CATEGORIES;
    const channels = {};
    categories.forEach(cat => { channels[cat] = CIGNAL_CHANNELS[cat] || []; });
    return channels;
  };

  const getFilteredChannels = (planName) => {
    const allChannels = getPlanChannels(planName);
    if (channelCat === "All") return allChannels;
    return { [channelCat]: allChannels[channelCat] || [] };
  };

  const getTotalChannels = (planName) => {
    const cats = getPlanChannels(planName);
    return Object.values(cats).reduce((s, chs) => s + chs.length, 0);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Prepaid Plans</h1>
        <p className="text-xs text-slate-500 mt-0.5">Available Cignal prepaid load packages — click a plan to view included channels</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Plans",    value: loading ? "..." : plans.length,         color: "text-slate-800" },
          { label: "Active Plans",   value: loading ? "..." : activePlans.length,   color: "text-green-600" },
          { label: "Inactive Plans", value: loading ? "..." : inactivePlans.length, color: "text-slate-400" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">All Plans <span className="text-slate-400 font-normal text-xs">(click to see channels)</span></h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No plans found. Run the SQL seed to add plans.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {plans.map(p => (
              <button key={p.id} onClick={() => { setModal(p); setChannelCat("All"); }}
                className={`text-left p-4 rounded-xl border transition-all hover:shadow-md hover:border-red-300 ${
                  p.status === "active" ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.plan_name}</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">₱{Number(p.amount).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{p.validity_days} days validity</p>
                {(p.hd_channels > 0 || p.sd_channels > 0) && (
                  <p className="text-slate-400" style={{ fontSize: "10px" }}>{p.hd_channels} HD · {p.sd_channels} SD channels</p>
                )}
                {p.benefits_text && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{p.benefits_text}</p>}
                <div className="mt-2 flex items-center gap-1 text-red-600">
                  <Tv size={10} />
                  <span style={{ fontSize: "10px" }} className="font-semibold">{getTotalChannels(p.plan_name)} channels included</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Channel Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-red-700 to-red-600 text-white flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold">{selectedPlan.plan_name} — Channel Lineup</h2>
                <p className="text-xs text-white/80 mt-0.5">₱{Number(selectedPlan.amount).toLocaleString()} · {selectedPlan.validity_days} days · {getTotalChannels(selectedPlan.plan_name)} channels</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded-xl hover:bg-white/20"><X size={18} /></button>
            </div>

            {/* Category Tabs */}
            <div className="px-5 py-3 border-b border-slate-100 flex gap-1.5 flex-wrap flex-shrink-0">
              {["All", ...Object.keys(getPlanChannels(selectedPlan.plan_name))].map(cat => (
                <button key={cat} onClick={() => setChannelCat(cat)}
                  className={`text-xs px-3 py-1 rounded-xl font-medium transition-colors ${
                    channelCat === cat ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Channels Grid */}
            <div className="p-5 overflow-y-auto">
              {Object.entries(getFilteredChannels(selectedPlan.plan_name)).map(([cat, channels]) => (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">{cat}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {channels.map(ch => (
                      <div key={ch} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Tv size={10} className="text-red-600" />
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{ch}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
