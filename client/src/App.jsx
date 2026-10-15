
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function requestJSON(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function App() {
  const [results, setResults] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [uptimeStats, setUptimeStats] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState("");
  const [endpointError, setEndpointError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    url: "",
    threshold: 500,
  });

  const checking = useRef(false);

  const loadEndpoints = useCallback(async () => {
    try {
      const data = await requestJSON(`${API}/api/endpoints`);
      const list = Array.isArray(data) ? data : [];

      setEndpoints(list);
      setEndpointError("");

      setSelectedEndpoint((current) => {
        if (list.some((endpoint) => String(endpoint.id) === current)) {
          return current;
        }
        return list.length ? String(list[0].id) : "";
      });
    } catch (err) {
      setEndpointError(err.message || "Could not load endpoints.");
    }
  }, []);

  const loadUptime = useCallback(async () => {
    try {
      const data = await requestJSON(`${API}/api/uptime`);
      setUptimeStats(Array.isArray(data) ? data : []);
    } catch {
      setUptimeStats([]);
    }
  }, []);

  const loadHistory = useCallback(async (id) => {
    if (!id) {
      setHistory([]);
      return;
    }

    try {
      const data = await requestJSON(`${API}/api/history/${id}`);
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const runChecks = useCallback(async () => {
    if (checking.current) return;

    checking.current = true;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await requestJSON(`${API}/api/monitor`);

      if (!Array.isArray(data)) {
        throw new Error("Unexpected monitoring response.");
      }

      setResults(data);
      setLastChecked(new Date());

      // Fetch uptime statistics after the checks are recorded.
      await loadUptime();
    } catch (err) {
      setError(err.message || "Unable to reach the monitoring server.");
    } finally {
      checking.current = false;
      setLoading(false);
    }
  }, [loadUptime]);

  useEffect(() => {
    loadEndpoints();
    runChecks();

    const timer = setInterval(() => {
      loadEndpoints();
      runChecks();
    }, 15000);

    return () => clearInterval(timer);
  }, [loadEndpoints, runChecks]);

  useEffect(() => {
    loadHistory(selectedEndpoint);

    const timer = setInterval(() => {
      loadHistory(selectedEndpoint);
    }, 15000);

    return () => clearInterval(timer);
  }, [selectedEndpoint, loadHistory]);

  useEffect(() => {
    if (!selectedEndpoint) return;

    const timer = setTimeout(() => {
      loadHistory(selectedEndpoint);
    }, 1000);

    return () => clearTimeout(timer);
  }, [lastChecked, selectedEndpoint, loadHistory]);

  async function addEndpoint(event) {
    event.preventDefault();
    setEndpointError("");
    setMessage("");

    try {
      await requestJSON(`${API}/api/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          url: form.url.trim(),
          threshold: Number(form.threshold),
        }),
      });

      setForm({ name: "", url: "", threshold: 500 });
      setMessage("Endpoint added successfully.");
      await loadEndpoints();
      await runChecks();
    } catch (err) {
      setEndpointError(err.message || "Could not add endpoint.");
    }
  }

  async function removeEndpoint(id) {
    if (!window.confirm("Remove this endpoint?")) return;

    setEndpointError("");
    setMessage("");

    try {
      await requestJSON(`${API}/api/endpoints/${id}`, {
        method: "DELETE",
      });

      setMessage("Endpoint removed successfully.");
      await loadEndpoints();
      await runChecks();
      await loadHistory(selectedEndpoint);
    } catch (err) {
      setEndpointError(err.message || "Could not remove endpoint.");
    }
  }

  const summary = useMemo(
    () => ({
      healthy: results.filter((r) => r.status === "healthy").length,
      slow: results.filter((r) => r.status === "slow").length,
      down: results.filter((r) => r.status === "down").length,
    }),
    [results]
  );

  const overallStatus = error
    ? "Monitoring unavailable"
    : loading
      ? "Checking your endpoints"
      : summary.down > 0
        ? "Some endpoints need attention"
        : summary.slow > 0
          ? "Performance needs attention"
          : results.length > 0
            ? "All systems operational"
            : "Waiting for endpoints";

  const chartData = history.map((item, index) => ({
    ...item,
    check: index + 1,
    timeLabel: item.time
      ? new Date(item.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : `Check ${index + 1}`,
  }));

  const selectedName =
    endpoints.find((endpoint) => String(endpoint.id) === selectedEndpoint)
      ?.name || "Selected endpoint";

  const selectedThreshold =
    endpoints.find((endpoint) => String(endpoint.id) === selectedEndpoint)
      ?.threshold ?? 500;

  const averageResponse = chartData.length
    ? Math.round(
        chartData.reduce((total, item) => total + item.responseTime, 0) /
          chartData.length
      )
    : 0;

  return (
    <main className="container">
      <nav className="topbar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <div className="brand-mark">M</div>
          <span>
            Monitor <span className="brand-light">/ API</span>
          </span>
        </a>

        <div className="topbar-meta">
          <span className={`system-dot ${error ? "offline" : "online"}`} />
          {error ? "Connection issue" : "Monitoring service"}
        </div>
      </nav>

      <header className="page-header">
        <div>
          <p className="eyebrow">DEVELOPER TOOLS / MONITORING</p>
          <h1>API Health &amp; Performance Monitor</h1>
          <p className="subtitle">
            A clear view of API availability and response performance.
          </p>
        </div>

        <button className="refresh" onClick={runChecks} disabled={loading}>
          <span className="refresh-icon">↻</span>
          {loading ? "Checking..." : "Run checks"}
        </button>
      </header>

      <section className="overview">
        <div className="overview-main">
          <p className="overview-label">SYSTEM OVERVIEW</p>
          <h2>{overallStatus}</h2>
          <p className="overview-description">
            {lastChecked
              ? `Last checked at ${lastChecked.toLocaleTimeString()}`
              : "Waiting for the first health check."}
          </p>
        </div>

        <div className="overview-count">
          <strong>{results.length.toString().padStart(2, "0")}</strong>
          <span>Monitored endpoints</span>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

{results.some((result) => result.status === "down") && (
  <div className="notice error">
    <strong>API failure detected</strong>
    <p>
      {results
        .filter((result) => result.status === "down")
        .map((result) => result.name)
        .join(", ")}{" "}
      {results.filter((result) => result.status === "down").length === 1
        ? "is"
        : "are"}{" "}
      currently down. Check the endpoint status below.
    </p>
  </div>
)}

{!loading &&
  results.length > 0 &&
  results.every((result) => result.status !== "down") &&
  lastChecked && (
    <div className="notice success">
      All monitored APIs are responding successfully.
    </div>
  )}

{endpointError && <div className="notice error">{endpointError}</div>}
{message && <div className="notice success">{message}</div>}

      <section className="summary">
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-icon healthy-icon">✓</span>
            <span className="summary-label">Healthy</span>
          </div>
          <strong>{summary.healthy.toString().padStart(2, "0")}</strong>
          <p>Responding normally</p>
        </div>

        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-icon slow-icon">↗</span>
            <span className="summary-label">Slow</span>
          </div>
          <strong>{summary.slow.toString().padStart(2, "0")}</strong>
          <p>Above response threshold</p>
        </div>

        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-icon down-icon">!</span>
            <span className="summary-label">Down</span>
          </div>
          <strong>{summary.down.toString().padStart(2, "0")}</strong>
          <p>Not responding normally</p>
        </div>
      </section>

      {/* NEW: Uptime statistics */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">AVAILABILITY ANALYTICS</p>
            <h2>API uptime statistics</h2>
            <p className="panel-note">
              Availability calculated from checks recorded during this server
              session.
            </p>
          </div>

          <button
            className="refresh"
            onClick={loadUptime}
            type="button"
          >
            Refresh uptime
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ENDPOINT</th>
                <th>UPTIME</th>
                <th>SUCCESSFUL</th>
                <th>FAILED</th>
                <th>TOTAL CHECKS</th>
                <th>LAST CHECKED</th>
              </tr>
            </thead>

            <tbody>
              {uptimeStats.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Uptime statistics are not available yet.
                  </td>
                </tr>
              ) : (
                uptimeStats.map((stat) => (
                  <tr key={stat.id}>
                    <td>
                      <strong>{stat.name}</strong>
                    </td>
                    <td>
                      <strong className="response-time">
                        {stat.uptimePercentage == null
                          ? "Awaiting checks"
                          : `${stat.uptimePercentage}%`}
                      </strong>
                    </td>
                    <td>{stat.successfulChecks}</td>
                    <td>{stat.failedChecks}</td>
                    <td>{stat.totalChecks}</td>
                    <td>
                      {stat.lastChecked
                        ? new Date(stat.lastChecked).toLocaleTimeString()
                        : "Not checked yet"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="chart-footnote">
          A slow response counts as successful if the API returns a successful
          HTTP status. Uptime statistics reset when the backend restarts.
          They represent this session, not a rolling 24-hour period.
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">LIVE MONITORING</p>
            <h2>Monitored APIs</h2>
          </div>
          <span className="auto-refresh">
            <span className="system-dot online" />
            Updates every 15 seconds
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ENDPOINT</th>
                <th>STATUS</th>
                <th>RESPONSE TIME</th>
                <th>HTTP CODE</th>
                <th>THRESHOLD</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {loading
                      ? "Checking APIs..."
                      : "No monitoring results available."}
                  </td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result.id}>
                    <td>
                      <div className="endpoint-name">
                        <span className={`endpoint-dot ${result.status}`} />
                        <div>
                          <strong>{result.name}</strong>
                          <small>{result.url}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${result.status}`}>
                        <span className="badge-dot" />
                        {result.status}
                      </span>
                    </td>
                    <td>
                      <strong className="response-time">
                        {result.responseTime ?? "—"}
                      </strong>
                      <span className="unit"> ms</span>
                    </td>
                    <td>{result.statusCode ?? "—"}</td>
                    <td>{result.threshold} ms</td>
                    <td>
                      <button
                        className="delete"
                        onClick={() => removeEndpoint(result.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel history-panel">
        <div className="panel-heading history-heading">
          <div>
            <p className="section-kicker">PERFORMANCE ANALYTICS</p>
            <h2>Response-time history</h2>
            <p className="panel-note">
              View recent response times for each monitored endpoint.
            </p>
          </div>

          <label className="history-select-label">
            Select API
            <select
              value={selectedEndpoint}
              onChange={(event) => setSelectedEndpoint(event.target.value)}
              disabled={endpoints.length === 0}
            >
              {endpoints.length === 0 && (
                <option value="">No endpoints</option>
              )}
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={String(endpoint.id)}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="chart-summary">
          <div>
            <span>Selected endpoint</span>
            <strong>{selectedName}</strong>
          </div>
          <div>
            <span>Average response</span>
            <strong>{history.length ? `${averageResponse} ms` : "—"}</strong>
          </div>
          <div>
            <span>Response threshold</span>
            <strong>
              {selectedEndpoint ? `${selectedThreshold} ms` : "—"}
            </strong>
          </div>
        </div>

        <div className="chart-container">
          {chartData.length === 0 ? (
            <div className="chart-empty">
              <span className="chart-empty-icon">↗</span>
              <strong>No history available yet</strong>
              <p>
                Run a few monitoring checks. Your response-time history will
                appear here automatically.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e8ece9"
                  vertical={false}
                />

                <ReferenceLine
                  y={Number(selectedThreshold)}
                  stroke="#d69a3a"
                  strokeDasharray="5 5"
                  label={{
                    value: `Threshold ${selectedThreshold} ms`,
                    position: "insideTopRight",
                    fill: "#a87928",
                    fontSize: 11,
                  }}
                />

                <XAxis
                  dataKey="timeLabel"
                  tick={{ fill: "#7b8580", fontSize: 11 }}
                  axisLine={{ stroke: "#e1e7e3" }}
                  tickLine={false}
                  minTickGap={24}
                />

                <YAxis
                  tick={{ fill: "#7b8580", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  unit=" ms"
                  domain={[
                    0,
                    (dataMax) =>
                      Math.max(dataMax, Number(selectedThreshold)) * 1.15,
                  ]}
                />

                <Tooltip
                  contentStyle={{
                    border: "1px solid #e5eae6",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} ms`, "Response time"]}
                  labelFormatter={(label) => `Checked at ${label}`}
                />

                <Line
                  type="monotone"
                  dataKey="responseTime"
                  name="Response time"
                  stroke="#24875b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#24875b", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="chart-footnote">
          The green line shows response time; the dashed amber line shows the
          configured threshold. The server keeps the latest 12 checks per
          endpoint. History is stored in memory and resets when the backend
          restarts.
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">CONFIGURATION</p>
            <h2>Add an endpoint</h2>
          </div>
          <span className="panel-note">Register an API to monitor</span>
        </div>

        <form onSubmit={addEndpoint} className="form">
          <label>
            API name
            <input
              placeholder="e.g. User Service"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label>
            Endpoint URL
            <input
              type="url"
              placeholder="https://example.com/health"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </label>

          <label>
            Threshold (ms)
            <input
              type="number"
              min="1"
              max="60000"
              value={form.threshold}
              onChange={(e) => setForm({ ...form, threshold: e.target.value })}
              required
            />
          </label>

          <button type="submit" className="add-button">
            <span>+</span> Add endpoint
          </button>
        </form>
      </section>

      <section className="panel configured-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">ENDPOINT DIRECTORY</p>
            <h2>Configured endpoints</h2>
          </div>
          <span className="count-pill">{endpoints.length} registered</span>
        </div>

        <div className="endpoint-list">
          {endpoints.length === 0 ? (
            <p className="empty-list">No configured endpoints found.</p>
          ) : (
            endpoints.map((endpoint) => (
              <div className="endpoint" key={endpoint.id}>
                <div className="endpoint-list-icon">API</div>
                <div className="endpoint-list-details">
                  <strong>{endpoint.name}</strong>
                  <small>{endpoint.url}</small>
                </div>
                <span className="directory-arrow">↗</span>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="footer">
        <span>MONITOR / API</span>
        <span>API Health &amp; Performance Monitor</span>
        <span>Local development environment</span>
      </footer>
    </main>
  );
}

export default App;
