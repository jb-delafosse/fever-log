# Fever Log

A local-first web application for tracking PFAPA fever episodes, symptoms, treatments, and doctor visits.

## Overview

Fever Log helps parents track their child's PFAPA (Periodic Fever, Aphthous Stomatitis, Pharyngitis, and Adenitis) syndrome episodes. The app works offline-first, storing data locally on your device, with automatic sync to your self-hosted server.

### Key Features

- **Temperature Tracking**: Log temperature readings in Celsius or Fahrenheit
- **Symptom Logging**: Track common PFAPA symptoms (sore throat, fatigue, stomach ache, etc.)
- **Treatment Tracking**: Record medications and their effectiveness
- **Doctor Visits**: Document medical appointments and outcomes
- **Special Events**: Log surgeries, hospitalizations, and other significant events
- **Episode Detection**: Automatic grouping of events into fever episodes (48-hour gap rule)
- **Reports & Analytics**: View statistics, symptom frequency, and treatment effectiveness
- **Printable Reports**: Generate doctor-friendly reports for medical consultations
- **Data Export/Import**: Backup and restore your data (JSON/CSV formats)
- **Multi-Device Sync**: Automatic synchronization across all your devices
- **PWA Support**: Install on your phone for quick access
- **Offline-First**: Works without internet connection

---

## Self-Hosting (Docker)

### Prerequisites

- Docker and Docker Compose
- A server, NAS, or any Docker-compatible system

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/fever-log.git
cd fever-log

# 2. Create your .env file
cp .env.example .env

# 3. Edit .env and set your password
nano .env  # Set AUTH_PASSWORD=your-secure-password

# 4. Create data directory
mkdir -p data

# 5. Build and start
docker-compose up -d

# 6. Access at http://localhost:3000
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AUTH_PASSWORD` | Shared password for all users | - | **Yes** |
| `DATABASE_PATH` | SQLite database path | `/app/data/fever-log.db` | No |
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Server port | `3000` | No |

### Data Persistence

**Important:** Your data is stored in a SQLite database. The `./data` directory must be mounted as a volume for data to persist across container restarts.

```yaml
# docker-compose.yml
volumes:
  - ./data:/app/data  # REQUIRED!
```

**Without this volume mount, all data will be lost when the container restarts.**

After deployment, your data directory will contain:
```
data/
├── fever-log.db      # SQLite database (all events)
├── fever-log.db-wal  # Write-ahead log
└── fever-log.db-shm  # Shared memory file
```

### Synology NAS Deployment

1. **SSH into your Synology NAS**
   ```bash
   ssh admin@your-nas-ip
   ```

2. **Create project directory**
   ```bash
   cd /volume1/docker
   git clone https://github.com/your-username/fever-log.git
   cd fever-log
   ```

3. **Create configuration**
   ```bash
   cp .env.example .env
   nano .env  # Set AUTH_PASSWORD
   mkdir -p data
   ```

4. **Set permissions** (important for Synology)
   ```bash
   chown -R 1001:1001 data
   ```

5. **Build and start**
   ```bash
   docker-compose up -d
   ```

6. **Access the app**
   - Open `http://your-nas-ip:3000` in your browser
   - Log in with your AUTH_PASSWORD

7. **Optional: Set up reverse proxy**
   - Use Synology's built-in reverse proxy (Control Panel > Application Portal > Reverse Proxy)
   - Point your domain to port 3000

---

## Authentication

### How It Works

- Set `AUTH_PASSWORD` environment variable before starting the server
- All users/devices use the same password
- Session expires after 7 days (automatic re-login required)
- API endpoints are protected (require valid session)

### Changing the Password

1. Stop the container: `docker-compose down`
2. Edit `.env` file with new password
3. Start the container: `docker-compose up -d`
4. All users will need to log in again with the new password

---

## Multi-Device Sync

### How It Works

- Data syncs automatically every 30 seconds when online
- Uses checkpoint-based sync protocol
- Last-write-wins conflict resolution
- Works offline - syncs when back online

### No Configuration Needed

Sync works automatically once you're logged in. Just use the app on multiple devices and data will stay in sync.

### Sync Status Indicator

Look for the indicator in the header:
- 🟢 **Green** - Synced
- 🔵 **Blue (pulsing)** - Syncing...
- 🔴 **Red** - Error
- ⚫ **Gray** - Offline

---

## Backup & Restore

### Database Backup

The simplest backup is to copy the SQLite database file:

```bash
# Stop the container first (recommended)
docker-compose down

# Copy the database
cp data/fever-log.db backup/fever-log-$(date +%Y%m%d).db

# Restart
docker-compose up -d
```

### In-App Export

1. Go to **Settings**
2. Click **Export as JSON** or **Export as CSV**
3. Save the downloaded file

### In-App Import

1. Go to **Settings**
2. Click **Import JSON (Merge)** to add events without deleting existing data
3. Or click **Import JSON (Replace All)** to replace all data

---

## Development

### Prerequisites

- Node.js >= 20.17.0
- npm

### Local Development

```bash
# Install dependencies
npm install

# Set environment variable for development
export AUTH_PASSWORD=dev-password

# Start development server
npm run dev

# Open http://localhost:3000
```

### Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
fever-log/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/ui/    # shadcn/ui components
│   ├── domain/           # Entities and business logic
│   ├── application/      # Use cases
│   ├── infrastructure/   # Database layer (Dexie + SQLite)
│   ├── presentation/     # React components and hooks
│   └── lib/              # Utilities (auth, etc.)
├── data/                 # SQLite database (production)
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## Architecture

Fever Log follows Clean Architecture principles:

```
src/
├── domain/           # Business logic (entities, value objects)
├── application/      # Use cases and ports
├── infrastructure/   # Database adapters
│   ├── persistence/
│   │   ├── local/    # Dexie.js (IndexedDB) - client
│   │   └── server/   # SQLite - server
│   └── sync/         # Sync engine
├── presentation/     # React components and hooks
└── app/              # Next.js pages and API routes
```

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Client Database**: Dexie.js (IndexedDB)
- **Server Database**: SQLite (better-sqlite3)
- **Sync**: Custom checkpoint-based protocol
- **PWA**: Serwist (Service Worker)
- **Deployment**: Docker

---

## Data Privacy

- **Local-First**: Data is stored locally on your device first
- **Self-Hosted**: You own and control all your data
- **No Cloud**: No data is sent to external servers
- **Offline**: Works without internet connection
- **Encrypted Transit**: Use HTTPS (reverse proxy) for secure sync

---

## Troubleshooting

### "Server Not Configured" Error

Make sure `AUTH_PASSWORD` is set in your `.env` file and the container has been restarted.

### Data Not Persisting

Check that the volume mount is correct in `docker-compose.yml`:
```yaml
volumes:
  - ./data:/app/data
```

### Permission Denied (Synology/Linux)

Set correct permissions on the data directory:
```bash
chown -R 1001:1001 data
```

### Sync Not Working

1. Check you're logged in (same password on all devices)
2. Check network connectivity
3. Look at the sync status indicator
4. Check container logs: `docker-compose logs -f`

---

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
