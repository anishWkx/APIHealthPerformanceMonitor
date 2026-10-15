## Live Demo

- **Live Dashboard:** [API Health & Performance Monitor](https://api-health-performance-monitor-eight.vercel.app/)
- **Backend API:** [Live API Endpoints](https://apihealthperformancemonitor.onrender.com/api/endpoints)
- **GitHub Repository:** [Source Code](https://github.com/anishWkx/APIHealthPerformanceMonitor)



# API Health & Performance Monitor

I built this project to monitor APIs and understand how they perform in real time. It provides a dashboard where I can check whether an API is working, measure its response time, track uptime statistics, and view recent performance history.

The main goal of this project was to build a practical full-stack application using React and Node.js while learning how API monitoring works.

## What it does

- Checks whether an API is working or unavailable.
- Measures API response times and identifies slow endpoints.
- Tracks successful and failed checks and calculates uptime percentages.
- Displays recent response-time history in a chart.
- Shows alerts when an API goes down.
- Allows users to add and remove API endpoints.
- Automatically refreshes monitoring results every 15 seconds.

## Technologies used

- **Frontend:** React, JavaScript, Vite, CSS
- **Backend:** Node.js, Express.js
- **Charts:** Recharts
- **Other tools:** Git and GitHub

## Project structure

```text id="4qj8dv"
APIHealthPerformanceMonitor/
├── client/       # React frontend
├── server/       # Express backend
└── README.md
```

## How to run the project

### Prerequisites

Make sure Node.js and npm are installed on your system.

### 1. Clone the repository

```bash id="qz8x2d"
git clone https://github.com/anishWkx/APIHealthPerformanceMonitor.git
cd APIHealthPerformanceMonitor
```

### 2. Start the backend

Open a terminal and run:

```bash id="m5z1cw"
cd server
npm install
npm run dev
```

The backend runs on `http://localhost:5001`.

### 3. Start the frontend

Open another terminal from the project folder and run:

```bash id="b9k4xw"
cd client
npm install
npm run dev
```

Open the local URL shown in the terminal, usually `http://localhost:5173`.

Keep both the frontend and backend running while using the application.

## How API status is determined

- **Healthy:** The API responds successfully within the configured time limit.
- **Slow:** The API responds successfully but takes longer than the configured threshold.
- **Down:** The request fails, times out, or returns an unsuccessful HTTP status.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/endpoints` | Get the configured endpoints |
| GET | `/api/monitor` | Run API health checks |
| GET | `/api/uptime` | Get uptime statistics |
| GET | `/api/history/:id` | View recent check history |
| POST | `/api/endpoints` | Add an endpoint |
| DELETE | `/api/endpoints/:id` | Remove an endpoint |

## Things to know

Currently, monitoring history and uptime statistics are stored in memory, so they reset whenever the backend restarts. The uptime percentage is calculated from checks recorded during the current backend session.

The frontend and backend are configured for local development. A few URL and environment settings need to be updated before deploying the application publicly.

## Future improvements

I would like to add database storage for monitoring history, longer-term uptime reports, and more notification options for API failures.

## Author

**Anish Bhaktula**

- GitHub: https://github.com/anishWkx
- LinkedIn: https://www.linkedin.com/in/anish-bhaktula-b3b307286/
