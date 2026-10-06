import express from "express";
import cors from "cors";

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const endpoints = [
  {
    id: 1,
    name: "Fast Demo API",
    url: `http://localhost:${PORT}/api/demo/fast`,
    threshold: 500
  },
  {
    id: 2,
    name: "Slow Demo API",
    url: `http://localhost:${PORT}/api/demo/slow`,
    threshold: 800
  },
  {
    id: 3,
    name: "Status API",
    url: `http://localhost:${PORT}/api/demo/status`,
    threshold: 500
  }
];

const history = new Map();

function ensureHistory(id) {
  if (!history.has(id)) history.set(id, []);
  return history.get(id);
}

function addHistory(id, result) {
  const items = ensureHistory(id);
  items.push({
    time: new Date().toISOString(),
    responseTime: result.responseTime,
    status: result.status,
    statusCode: result.statusCode
  });

  if (items.length > 12) items.shift();
}

async function checkEndpoint(endpoint) {
  const start = Date.now();

  try {
    const response = await fetch(endpoint.url);
    const responseTime = Date.now() - start;

    let status = "healthy";
    if (responseTime > endpoint.threshold) status = "slow";

    const result = {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status,
      statusCode: response.status,
      responseTime,
      threshold: endpoint.threshold,
      checkedAt: new Date().toISOString()
    };

    addHistory(endpoint.id, result);
    return result;
  } catch (error) {
    const responseTime = Date.now() - start;

    const result = {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status: "down",
      statusCode: null,
      responseTime,
      threshold: endpoint.threshold,
      checkedAt: new Date().toISOString(),
      error: error.message
    };

    addHistory(endpoint.id, result);
    return result;
  }
}

app.get("/api/endpoints", (req, res) => {
  res.json(endpoints);
});

app.get("/api/monitor", async (req, res) => {
  const results = await Promise.all(endpoints.map(checkEndpoint));
  res.json(results);
});

app.get("/api/history/:id", (req, res) => {
  res.json(history.get(Number(req.params.id)) || []);
});

app.post("/api/endpoints", (req, res) => {
  const { name, url, threshold } = req.body;

  if (!name || !url) {
    return res.status(400).json({ message: "Name and URL are required." });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ message: "Please enter a valid URL." });
  }

  const endpoint = {
    id: Date.now(),
    name,
    url,
    threshold: Number(threshold) || 500
  };

  endpoints.push(endpoint);
  res.status(201).json(endpoint);
});

app.delete("/api/endpoints/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = endpoints.findIndex((endpoint) => endpoint.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Endpoint not found." });
  }

  endpoints.splice(index, 1);
  history.delete(id);

  res.json({ message: "Endpoint removed." });
});

// Built-in demo APIs
app.get("/api/demo/fast", (req, res) => {
  res.json({ message: "Fast API is working", timestamp: new Date().toISOString() });
});

app.get("/api/demo/slow", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  res.json({ message: "Slow API is working", timestamp: new Date().toISOString() });
});

app.get("/api/demo/status", (req, res) => {
  res.json({ service: "demo-status", status: "operational" });
});

app.listen(PORT, () => {
  console.log(`API monitor server running on http://localhost:${PORT}`);
});
