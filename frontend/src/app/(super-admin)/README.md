# Super Admin Portal

**Path**: `src/app/(super-admin)`
**URL**: `http://localhost:3000/admin/dashboard`

This portal is for the platform owner to manage the system.

## Features
- **Dashboard**: View high-level stats (Total Designers, Revenue).
- **Approvals**: Approve or reject new designer signups.
- **Activity Log**: Monitor system-wide events.

## Components
- `usePendingApprovals.ts`: Hook for managing approval workflow.
- `usePlatformStats.ts`: Hook for fetching platform statistics.
