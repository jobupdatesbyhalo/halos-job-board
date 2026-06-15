import { useState, useEffect } from "react";

const PINK = "#F45B8E";
const DARK = "#1A1A2E";
const LIGHT_PINK = "#FDE8F0";

const CATEGORIES = ["All", "Tech", "Marketing", "Design", "Customer Service", "Finance", "HR", "Writing", "Sales", "Operations"];

function isWorldwide(location) {
  if (!location) return true;
  const loc = location.toLowerCase();
  const blocked = ["usa only", "us only", "united states only", "germany only", "uk only", "canada only", "australia only", "europe only"];
  const allowed = ["worldwide", "global", "anywhere", "remote", "international", ""];
  if (blocked.some(b => loc.includes(b))) return false;
  if (allowed.some(a => loc.includes(a))) return true;
  return false;
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function JobCard({ job }) {
  return (
    <div onClick={() => window.open(job.url, "_blank")} style={{
      background: "#fff", borderRadius: 16, padding: "20px",
      border: "1px solid #F0E0E8", cursor: "pointer", marginBottom: 16,
      boxShadow: "0 2px 8px rgba(244,91,142,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        {job.company_logo ? (
          <img src={job.company_logo} alt={job.company_name}
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: "contain", border: "1px solid #F0E0E8", flexShrink: 0 }}
            onError={e => e.target.style.display = "none"}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: LIGHT_PINK,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: PINK, flexShrink: 0
          }}>
            {job.company_name?.[0] || "?"}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 2 }}>{job.title}</div>
          <div style={{ fontSize: 13, color: "#888" }}>{job.company_name}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={{ background: LIGHT_PINK, color: PINK, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
          📍 {job.location || "Worldwide"}
        </span>
        {job.job_type && (
          <span style={{ background: "#F0F4FF", color: "#4A6CF7", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            {job.job_type}
          </span>
        )}
        {job.salary && (
          <span style={{ background: "#F0FFF4", color: "#22A35A", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            💰 {job.salary}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>{timeAgo(job.date || job.publication_date)}</span>
        <button style={{
          background: PINK, color: "#fff", border: "none", borderRadius: 20,
          padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer"
        }}>Apply Now →</button>
      </div>
    </div>
  );
}

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const [r1, r2] = await Promise.allSettled([
          fetch("https://remotive.com/api/remote-jobs?limit=100").then(r => r.json()),
          fetch("https://himalayas.app/jobs/api?limit=100").then(r => r.json()),
        ]);
        let all = [];
        if (r1.status === "fulfilled") all = [...all, ...(r1.value.jobs || []).map(j => ({ ...j, date: j.publication_date, location: j.candidate_required_location }))];
        if (r2.status === "fulfilled") all = [...all, ...(r2.value.jobs || [])];
        const worldwide = all.filter(j => isWorldwide(j.location || j.candidate_required_location));
        setJobs(worldwide);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    let result = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j => j.title?.toLowerCase().includes(q) || j.company_name?.toLowerCase().includes(q));
    }
    if (category !== "All") {
      result = result.filter(j =>
        j.category?.name?.toLowerCase().includes(category.toLowerCase()) ||
        j.title?.toLowerCase().includes(category.toLowerCase())
      );
    }
    setFiltered(result);
    setPage(1);
  }, [jobs, search, category]);

  const paginated = filtered.slice(0, page * PER_PAGE);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#FBF5F8", minHeight: "100vh" }}>
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #2D1B3D 100%)`,
        padding: "40px 20px 48px", textAlign: "center"
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: PINK, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          🔥 Updated Daily
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Halo's Job Board</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 24 }}>
          Built for Nigerian job seekers by Halo 💗
        </p>
        {!loading && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(244,91,142,0.15)", borderRadius: 24,
            padding: "8px 20px", marginBottom: 24
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
              {filtered.length} worldwide remote jobs available
            </span>
          </div>
        )}
        <div style={{
          maxWidth: 500, margin: "0 auto", background: "#fff", borderRadius: 16,
          display: "flex", alignItems: "center", padding: "6px 6px 6px 18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
        }}>
          <span style={{ fontSize: 18, marginRight: 10 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search role or company..."
            style={{ flex: 1, border: "none", fontSize: 15, color: DARK, background: "transparent", padding: "8px 0", outline: "none" }}
          />
          <button style={{
            background: PINK, color: "#fff", border: "none", borderRadius: 12,
            padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer"
          }}>Search</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #F0E0E8", padding: "12px 16px", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "7px 16px", borderRadius: 20, border: "none",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              background: category === cat ? PINK : LIGHT_PINK,
              color: category === cat ? "#fff" : PINK,
            }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading worldwide remote jobs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 8 }}>No jobs found</div>
            <button onClick={() => { setSearch(""); setCategory("All"); }} style={{
              marginTop: 16, background: PINK, color: "#fff", border: "none",
              borderRadius: 20, padding: "10px 24px", fontWeight: 700, cursor: "pointer"
            }}>Clear filters</button>
          </div>
        ) : (
          <>
            {paginated.map((job, i) => <JobCard key={job.id || i} job={job} />)}
            {paginated.length < filtered.length && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button onClick={() => setPage(p => p + 1)} style={{
                  background: PINK, color: "#fff", border: "none",
                  borderRadius: 24, padding: "12px 32px", fontSize: 15,
                  fontWeight: 700, cursor: "pointer"
                }}>Load More Jobs</button>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{
        background: DARK, color: "rgba(255,255,255,0.5)",
        textAlign: "center", padding: "20px", fontSize: 13
      }}>
        Built with 💗 by <strong style={{ color: PINK }}>Halo</strong> for Nigerian job seekers • Follow <strong style={{ color: PINK }}>@halosznn_</strong> on X
      </div>
    </div>
  );
}
