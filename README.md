# API Health & Performance Monitor

A full-stack web application for monitoring REST APIs and visualizing their health and performance through a centralized dashboard.

## Overview

The API Health & Performance Monitor allows users to monitor API endpoints and view important performance information such as response status, response time, and API availability from a single dashboard.

## Features

* Monitor REST API endpoints
* Check API health and availability
* Track API response times
* Identify failed or unavailable APIs
* Centralized monitoring dashboard
* Real-time API status checking
* Responsive web interface

## Tech Stack

### Frontend

* React.js
* JavaScript
* Vite
* CSS

### Backend

* Node.js
* Express.js
* REST APIs

## Project Structure

```text
APIHealthPerformanceMonitor/
│
├── client/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

### 1. Clone the repository

```bash
git clone https://github.com/anishWkx/APIHealthPerformanceMonitor.git
cd APIHealthPerformanceMonitor
```

### 2. Start the backend

```bash
cd server
npm install
node server.js
```

The backend runs on:

```text
http://localhost:5001
```

### 3. Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the frontend URL in your browser to access the dashboard.

## Future Improvements

* Historical performance tracking
* API response-time charts
* Database integration for storing monitoring history
* Automated alerts for API failures
* Authentication and role-based access

## Author

Anish Bhaktula
