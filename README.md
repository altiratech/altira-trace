# RIA Launch & Compliance OS

Pilot foundation for a newly launched, examination-ready RIA operating system.

This repo promotes the `Business Ideas/RIA App` strategy pack into a standalone implementation repo under `Code/active/`.

## What is implemented

- Next.js App Router application with a control-tower style UI
- Multi-tenant-ready Prisma schema for organizations, roles, obligations, evidence, approvals, annual review, exam room, vendors, incidents, marketing review, AI guidance, and activity logs
- Local cookie-based auth for seeded placeholder users
- Profile-driven obligation generation and first-year launch milestone generation
- Pilot pages for dashboard, launch workspace, intake, obligations, documents, annual review, exam room, marketing review, vendors, team, and settings
- Strategy docs imported into `docs/strategy/`

## Placeholder data posture

This workspace follows global decision `D-014`: no realistic fake production data.

The seed only creates explicitly labeled placeholder users, organizations, evidence artifacts, and workflow records. Replace them with real user-entered or source-backed data before any live pilot use.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create the local database and generate the Prisma client:

```bash
npm run db:push
```

If Prisma hangs on this machine because the repo lives under Desktop/iCloud-backed paths, use the safe wrapper instead:

```bash
npm run db:push:safe
```

3. Seed the placeholder pilot workspace:

```bash
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Placeholder login accounts

- `founder@placeholder-ria.local` / `LaunchReady123!`
- `cco@placeholder-ria.local` / `LaunchReady123!`

## Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run db:generate:safe
npm run db:push
npm run db:push:safe
npm run db:seed
npm run db:reset
```

## Important boundary

The product assists workflow, documentation, evidence capture, and review. It does not make legal determinations or replace firm-specific legal advice.
