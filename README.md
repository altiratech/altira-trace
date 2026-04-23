# RIA Launch & Compliance OS

RIA Launch & Compliance OS is a pilot foundation for a newly launched, examination-ready RIA operating system.

It focuses on workflow assistance, documentation, evidence capture, review, and operating cadence. It does not make legal determinations or replace firm-specific legal advice.

## Status

Active pilot foundation.

Implemented today:
- Next.js App Router application with a control-tower style UI
- multi-tenant-ready Prisma schema for organizations, roles, obligations, evidence, approvals, annual review, exam room, vendors, incidents, marketing review, AI guidance, and activity logs
- local cookie-based auth for seeded placeholder users
- profile-driven obligation generation and first-year launch milestone generation
- pilot pages for dashboard, launch workspace, intake, obligations, documents, annual review, exam room, marketing review, vendors, team, and settings
- strategy docs in `docs/strategy/`

## Placeholder Data Posture

This repo uses explicitly labeled placeholder data only.

Seeded users, organizations, evidence artifacts, and workflow records are for local pilot review. Replace them with real user-entered or source-backed records before any live use.

## Local Setup

```bash
git clone https://github.com/altiratech/ria-launch-compliance-os.git
cd ria-launch-compliance-os
npm install
```

Create the local database and generate the Prisma client:

```bash
npm run db:push
```

If Prisma has trouble in your local filesystem environment, use the safe wrapper:

```bash
npm run db:push:safe
```

Seed the placeholder pilot workspace:

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Placeholder Login Accounts

- `founder@placeholder-ria.local` / `LaunchReady123!`
- `cco@placeholder-ria.local` / `LaunchReady123!`

These accounts are local placeholder credentials for seeded demo data. Do not use them for live deployments.

## Useful Commands

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

## Product Boundary

The product assists governed workflow and review. Compliance judgment, legal interpretation, registration strategy, and firm-specific policy decisions remain the responsibility of qualified human operators and advisors.

## License

No open-source license has been selected yet. Public source visibility does not grant reuse rights until a license file is added.
