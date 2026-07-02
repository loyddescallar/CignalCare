import { useState, useMemo } from "react";

/* =========================
   CUSTOMER PAGE (FIGMA STRUCTURE + SYSTEM LOGIC SAFE)
========================= */

export default function AdminCustomers({
  customers = [],
  thisMonthCount = 0,
  activeCount = 0,
  atRiskCount = 0,
  inactiveCount = 0,
}) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [ccaQuery, setCcaQuery] = useState("");

  /* =========================
     FILTERED DATA (KEEP LOGIC SAFE)
  ========================= */
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.accountName?.toLowerCase().includes(search.toLowerCase()) ||
        c.accountNo?.toLowerCase().includes(search.toLowerCase()) ||
        c.ccaNo?.toLowerCase().includes(search.toLowerCase());

      const matchLocation =
        locationFilter === "All" || c.location === locationFilter;

      return matchSearch && matchLocation;
    });
  }, [customers, search, locationFilter]);

  /* =========================
     FIGMA STRUCTURE RENDERERS
  ========================= */

  const renderHeader = () => (
    <section className="bg-white rounded-[28px] border border-slate-200 p-6 flex items-center justify-between">

      <div>
        <p className="text-xs uppercase tracking-widest text-red-600 font-semibold">
          Customer Management
        </p>

        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Real customer records for CCA inquiry and prepaid support
        </h1>

        <p className="text-sm text-slate-500 mt-2 max-w-2xl">
          Use this as your source of truth for account number, CCA number, contact details,
          and customer profile data across the admin dashboard.
        </p>
      </div>

      <button
        onClick={() => alert("Open Add Customer Modal")}
        className="bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-red-700"
      >
        + Add Customer
      </button>
    </section>
  );

  const Kpi = ({ label, value }) => (
    <div className="bg-white rounded-2xl border p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );

  const renderKpis = () => (
    <section className="grid grid-cols-5 gap-4">
      <Kpi label="Total Customers" value={customers.length} />
      <Kpi label="Registered This Month" value={thisMonthCount} />
      <Kpi label="Active Accounts" value={activeCount} />
      <Kpi label="At Risk" value={atRiskCount} />
      <Kpi label="Inactive" value={inactiveCount} />
    </section>
  );

  const renderCcaInquiry = () => (
    <section className="bg-white rounded-[28px] border p-5">
      <p className="font-semibold mb-3">CCA / Account Inquiry</p>

      <div className="flex gap-2">
        <input
          value={ccaQuery}
          onChange={(e) => setCcaQuery(e.target.value)}
          placeholder="Lookup Account Number or CCA Number"
          className="border p-2 rounded-xl w-full outline-none focus:ring-2 focus:ring-red-500"
        />

        <button className="bg-red-600 text-white px-5 rounded-xl">
          Search
        </button>
      </div>
    </section>
  );

  const renderFilters = () => (
    <section className="bg-white rounded-[28px] border p-4 flex flex-col gap-3">

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, account, CCA, phone..."
        className="border p-2 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
      />

      {/* LOCATION FILTER */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Balayan", "Calaca", "Lian", "Calatagan", "Nasugbu", "Lemery"].map(
          (loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-3 py-1 rounded-full text-sm border ${
                locationFilter === loc
                  ? "bg-red-600 text-white"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              {loc}
            </button>
          )
        )}
      </div>
    </section>
  );

  const renderTable = () => (
    <section className="bg-white rounded-[28px] border shadow-sm overflow-hidden">

      <div className="p-4 border-b">
        <p className="text-sm text-slate-500">
          Showing {filteredCustomers.length} record(s)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3 text-left">Account Name</th>
              <th className="p-3 text-left">Account No.</th>
              <th className="p-3 text-left">CCA No.</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((c, i) => (
              <tr key={i} className="border-b hover:bg-slate-50">
                <td className="p-3">{c.accountName}</td>
                <td className="p-3">{c.accountNo}</td>
                <td className="p-3">{c.ccaNo}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.address}</td>
                <td className="p-3">{c.createdAt}</td>

                <td className="p-3 flex gap-2">
                  <button className="px-2 py-1 border rounded">View</button>
                  <button className="px-2 py-1 border rounded">Edit</button>
                  <button className="px-2 py-1 border rounded text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );

  /* =========================
     FINAL LAYOUT (FIGMA FLOW)
  ========================= */
  return (
    <div className="space-y-6 bg-slate-50 p-6 rounded-2xl">

      {renderHeader()}

      {renderKpis()}

      {renderCcaInquiry()}

      {renderFilters()}

      {renderTable()}

    </div>
  );
}