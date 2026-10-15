import express from "express";
import cors from "cors";

const app = express();
const PORT = 5001;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_HISTORY = 12;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

const endpoints = [
  {
    id: 1,
    name: "Fast Demo API",
    url: `http://localhost:${PORT}/api/demo/fast`,
    threshold: 500,
  },
  {
    id: 2,
    name: "Slow Demo API",
    url: `http://localhost:${PORT}/api/demo/slow`,
    threshold: 800,
  },
  {
    id: 3,
    name: "Status API",
    url: `http://localhost:${PORT}/api/demo/status`,
    threshold: 500,
  },
];

// Stores recent response-time history.
const history = new Map();

// Stores uptime statistics for the current server session.
const uptimeStats = new Map();

function getUptimeStats(id) {
  if (!uptimeStats.has(id)) {
    uptimeStats.set(id, {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      lastChecked: null,
    });
  }

  return uptimeStats.get(id);
}

function addHistory(id, result) {
  if (!history.has(id)) {
    history.set(id, []);
  }

  const items = history.get(id);

  items.push({
    time: result.checkedAt,
    responseTime: result.responseTime,
    status: result.status,
    statusCode: result.statusCode,
  });

  if (items.length > MAX_HISTORY) {
    items.shift();
  }

  // Update uptime statistics for every monitoring check.
  const stats = getUptimeStats(id);

  stats.totalChecks += 1;
  stats.lastChecked = result.checkedAt;

  if (result.status === "down") {
    stats.failedChecks += 1;
  } else {
    stats.successfulChecks += 1;
  }
}

async function checkEndpoint(endpoint) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  const start = Date.now();

  try {
    const response = await fetch(endpoint.url, {
      signal: controller.signal,
      redirect: "error",
    });

    const responseTime = Date.now() - start;

    let status;

    if (!response.ok) {
      status = "down";
    } else if (responseTime > endpoint.threshold) {
      status = "slow";
    } else {
      status = "healthy";
    }

    const result = {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status,
      statusCode: response.status,
      responseTime,
      threshold: endpoint.threshold,
      checkedAt: new Date().toISOString(),
    };

    addHistory(endpoint.id, result);

    return result;
  } catch (error) {
    const result = {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status: "down",
      statusCode: null,
      responseTime: Date.now() - start,
      threshold: endpoint.threshold,
      checkedAt: new Date().toISOString(),
      error:
        error.name === "AbortError"
          ? "Request timed out."
          : "Endpoint could not be reached.",
    };

    addHistory(endpoint.id, result);

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

// Get all configured endpoints.
app.get("/api/endpoints", (req, res) => {
  res.json(endpoints);
});

// Check the health and performance of all endpoints.
app.get("/api/monitor", async (req, res) => {
  try {
    const results = await Promise.all(
      endpoints.map(checkEndpoint)
    );

    res.json(results);
  } catch {
    res.status(500).json({
      message: "Unable to complete monitoring checks.",
    });
  }
});

// Get uptime statistics for every configured endpoint.
app.get("/api/uptime", (req, res) => {
  const results = endpoints.map((endpoint) => {
    const stats = getUptimeStats(endpoint.id);

    const uptimePercentage =
      stats.totalChecks > 0
        ? Number(
            (
              (stats.successfulChecks / stats.totalChecks) *
              100
            ).toFixed(2)
          )
        : null;

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      totalChecks: stats.totalChecks,
      successfulChecks: stats.successfulChecks,
      failedChecks: stats.failedChecks,
      uptimePercentage,
      lastChecked: stats.lastChecked,
    };
  });

  res.json(results);
});

// Get recent monitoring history for one endpoint.
app.get("/api/history/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid endpoint ID.",
    });
  }

  res.json(history.get(id) || []);
});

// Register a new endpoint.
app.post("/api/endpoints", (req, res) => {
  const { name, url, threshold } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Enter a name between 1 and 100 characters.",
    });
  }

  if (typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      message: "A URL is required.",
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return res.status(400).json({
      message: "Please enter a valid URL.",
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({
      message: "Only HTTP and HTTPS URLs are supported.",
    });
  }

  const parsedThreshold =
    threshold === undefined || threshold === ""
      ? 500
      : Number(threshold);

  if (
    !Number.isFinite(parsedThreshold) ||
    parsedThreshold <= 0 ||
    parsedThreshold > 60000
  ) {
    return res.status(400).json({
      message: "Threshold must be between 1 and 60000 ms.",
    });
  }

  const endpoint = {
    id: Date.now(),
    name: name.trim(),
    url: parsedUrl.href,
    threshold: parsedThreshold,
  };

  endpoints.push(endpoint);

  // Initialize statistics for the new endpoint.
  getUptimeStats(endpoint.id);

  res.status(201).json(endpoint);
});

// Remove an endpoint and its stored history and statistics.
app.delete("/api/endpoints/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = endpoints.findIndex(
    (endpoint) => endpoint.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Endpoint not found.",
    });
  }

  endpoints.splice(index, 1);
  history.delete(id);
  uptimeStats.delete(id);

  res.json({
    message: "Endpoint removed successfully.",
  });
});

// Demo APIs.
app.get("/api/demo/fast", (req, res) => {
  res.json({
    message: "Fast API is working",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/demo/slow", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  res.json({
    message: "Slow API is working",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/demo/status", (req, res) => {
  res.json({
    service: "demo-status",
    status: "operational",
  });
});

// Handle malformed JSON requests.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: "Invalid JSON request body.",
    });
  }

  next(error);
});

app.listen(PORT, () => {
  console.log(
    `API monitor server running on http://localhost:${PORT}`
  );
});