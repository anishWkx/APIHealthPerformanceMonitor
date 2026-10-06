# API Health & Performance Monitor

A lightweight full-stack dashboard for monitoring API health, response time, status codes, and recent performance history.

## Tech Stack
- React.js + Vite
- Node.js
- Express.js
- REST APIs
- JavaScript

## Features
- Monitor configurable API endpoints
- Automated health checks
- Configurable slow-response threshold
- Status, response time, and status code display
- Recent response-time history
- Add/remove monitored endpoints
- Auto-refresh monitoring
- Built-in demo APIs so the project works without external services

## Run locally

### Backend
```bash
cd server
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```

Frontend runs on the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Interview explanation

"The project is a React and Node.js dashboard that periodically calls configured APIs and records their health, response time, and status code. The Express backend performs the health checks and keeps a small in-memory history for the dashboard. I also added configurable thresholds so an endpoint can be classified as healthy, slow, or down."
