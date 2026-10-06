import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000";

function App() {
  const [results, setResults] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [form, setForm] = useState({
    name: "",
    url: "",
    threshold: 500
  });

  async function loadEndpoints() {
    const response = await fetch(`${API}/api/endpoints`);
    setEndpoints(await response.json());
  }

  async function runChecks() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/monitor`);
      const data = await response.json();
      setResults(data);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEndpoints();
    runChecks();

    const interval = setInterval(runChecks, 15000);
    return () => clearInterval(interval);
  }, []);

  async function addEndpoint(event) {
    event.preventDefault();

    const response = await fetch(`${API}/api/endpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    setForm({ name: "", url: "", threshold: 500 });
    await loadEndpoints();
    runChecks();
  }

  async function removeEndpoint(id) {
    await fetch(`${API}/api/endpoints/${id}`, { method: "DELETE" });
    await loadEndpoints();
    runChecks();
  }

  const summary = useMemo(() => {
    return {
      healthy: results.filter((r) => r.status === "healthy").length,
      slow: results.filter((r) => r.status === "slow").length,
      down: results.filter((r) => r.status === "down").length
    };
  }, [results]);

  return (
    <main className="container">
      <header>
        <div>
          <p className="eyebrow">MONITORING DASHBOARD</p>
          <h1>API Health & Performance Monitor</h1>
          <p className="subtitle">
            Track API availability, response time and performance thresholds.
          </p>
        </div>

        <button className="refresh" onClick={runChecks}>
          {loading ? "Checking..." : "Run checks"}
        </button>
      </header>

      <section className="summary">
        <div className="summary-card">
          <span>Healthy</span>
          <strong>{summary.healthy}</strong>
        </div>
        <div className="summary-card">
          <span>Slow</span>
          <strong>{summary.slow}</strong>
        </div>
        <div className="summary-card">
          <span>Down</span>
          <strong>{summary.down}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Monitored APIs</h2>
          <span>
            {lastChecked
              ? `Last checked ${lastChecked.toLocaleTimeString()}`
              : "Waiting..."}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>API</th>
                <th>Status</th>
                <th>Response</th>
                <th>Status Code</th>
                <th>Threshold</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>
                    <strong>{result.name}</strong>
                    <small>{result.url}</small>
                  </td>
                  <td>
                    <span className={`badge ${result.status}`}>
                      {result.status}
                    </span>
                  </td>
                  <td>{result.responseTime} ms</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Add an endpoint</h2>
          <span>Checks run automatically every 15 seconds.</span>
        </div>

        <form onSubmit={addEndpoint} className="form">
          <input
            placeholder="API name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="https://example.com/api/health"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Threshold (ms)"
            value={form.threshold}
            onChange={(e) => setForm({ ...form, threshold: e.target.value })}
          />
          <button type="submit">Add API</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Configured endpoints</h2>
        </div>
        <div className="endpoint-list">
          {endpoints.map((endpoint) => (
            <div className="endpoint" key={endpoint.id}>
              <span>{endpoint.name}</span>
              <small>{endpoint.url}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
