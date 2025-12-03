# Elide Office Coordinator

A simple, mobile-responsive task coordination app for office teams, built with the [Elide runtime](https://elide.dev).

## Features

- **3 Team Members**: 2 Office Managers + 1 Ops Supervisor
- **Task Management**: Create, assign, and track task status
- **Mobile-First**: Responsive design optimized for phones
- **Lightweight**: Single-file server, minimal dependencies
- **Docker-Ready**: Easy deployment to any cloud provider

## Quick Start

### Prerequisites

Install Elide:
```bash
curl -sSL https://elide.sh | bash
```

### Run Locally

```bash
# Start the server
elide run --serve server.js

# Visit http://localhost:8080
```

### Run with Docker

```bash
# Build and run
docker-compose up -d

# Or manually
docker build -t elide-office-app .
docker run -p 3000:3000 elide-office-app
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main UI |
| GET | `/health` | Health check |
| GET | `/api/users` | List team members |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Task Object

```json
{
  "id": "abc123",
  "title": "Order supplies",
  "description": "Pens, paper, ink",
  "status": "todo|in-progress|done",
  "priority": "low|medium|high",
  "assignee": "mgr1",
  "created": "2025-12-03T22:00:00Z"
}
```

## Deploy to Digital Ocean

1. Create a $7/mo droplet (Ubuntu 24.04)
2. SSH into the droplet
3. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
4. Clone and run:
   ```bash
   git clone <repo>
   cd elide-office-app
   docker-compose up -d
   ```

## Testing

```bash
# Install Playwright
npm install

# Run tests
npm test

# Run with UI
npm run test:ui
```

## Tech Stack

- **Runtime**: [Elide](https://elide.dev) - Polyglot JavaScript runtime
- **UI**: Vanilla HTML/CSS/JS (no frameworks)
- **Storage**: JSON file persistence
- **Container**: Docker + docker-compose
- **Testing**: Playwright

## License

MIT
