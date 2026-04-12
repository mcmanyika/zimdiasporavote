# Defend the Constitution Platform

A Next.js website for the Defend the Constitution Platform - a citizen-led movement promoting lawful governance, public accountability, and peaceful civic participation.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Project Structure

```
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page component
│   └── globals.css     # Global styles with Tailwind
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Firestore Backup and Restore

This project includes scripts to back up and restore the full Firestore database using `gcloud`.

Set these environment variables in your shell before running:

```bash
export FIREBASE_PROJECT_ID=zimdiasporavote
export FIREBASE_BACKUP_BUCKET=gs://your-backup-bucket
```

Create a full backup:

```bash
npm run backup:firestore
```

Restore from a backup export folder:

```bash
npm run restore:firestore -- gs://your-backup-bucket/firestore-backups/2026-03-06-183500
```

Notes:
- You need Google Cloud SDK installed and authenticated (`gcloud auth login`).
- Restore can overwrite existing documents with matching IDs.

### Retention and Scheduling

Recommended retention:
- Daily backups: keep 30 days
- Weekly backups: keep 12 weeks
- Monthly backups: keep 12 months

Prune commands:

```bash
npm run backup:firestore:prune-daily
npm run backup:firestore:prune-weekly
```

Example cron schedule (server/VM):

```bash
# Every day at 01:00 - create backup
0 1 * * * cd /path/to/cdp && FIREBASE_PROJECT_ID=zimdiasporavote FIREBASE_BACKUP_BUCKET=gs://zimdiasporavote.firebasestorage.app npm run backup:firestore >> /var/log/firestore-backup.log 2>&1

# Every day at 01:30 - prune old daily backups
30 1 * * * cd /path/to/cdp && FIREBASE_BACKUP_BUCKET=gs://zimdiasporavote.firebasestorage.app npm run backup:firestore:prune-daily >> /var/log/firestore-backup.log 2>&1

# Every Sunday at 02:00 - prune weekly/monthly retention
0 2 * * 0 cd /path/to/cdp && FIREBASE_BACKUP_BUCKET=gs://zimdiasporavote.firebasestorage.app npm run backup:firestore:prune-weekly >> /var/log/firestore-backup.log 2>&1
```

Optional high-risk period schedule:
- Run `backup:firestore` every 12 hours instead of daily.

