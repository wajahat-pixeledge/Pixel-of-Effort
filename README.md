# Pixel of Effort (LOE Tracker)

> **A professional, high-performance Level of Effort (LOE) and time-tracking ecosystem designed to streamline agency and internal workforce management.**

Pixel of Effort is a modern, full-stack Next.js application tailored for organizations that need precise tracking of project hours, internal processes, and team capacity. With its intuitive interface, granular access controls, and dynamic configurations, it offers leaders full visibility into operational efficiency while remaining entirely frictionless for employees.

---

## 🎯 Key Features & Capabilities

### 1. Seamless Time Entry & Dashboards
* **Frictionless Logging:** Employees can swiftly log their daily hours against assigned projects, time off, or office processes.
* **Smart Validation:** Bulletproof form validation ensures project selections match context rules (e.g., you cannot log "Project" time without attaching an active project).
* **Personalized Dashboards:** A curated "My Time" dashboard shows recent entries, total hours logged, and upcoming active project assignments. 

### 2. Powerful Calendar & Capacity Planning
* **Visual Effort Heatmap:** A beautifully crafted calendar interface highlights daily work hours, zero-effort workdays, and weekend offsets.
* **Monthly Variant Summaries:** Instantly understand team capacity. The monthly summary calculates expected working hours against actual logged hours, generating positive or negative variance reports.
* **Global Visibility for Admins:** While individuals see their own timelines, administrators can seamlessly toggle to an "All Users" scope to review global team workload across a given month.

### 3. Dynamic Application Settings
* **Custom Categories:** Admins can create and toggle active time-entry categories (e.g., Billable, Internal, Training) without touching a single line of code.
* **Actionable Statuses:** Track edge-case entries through dynamic statuses such as "Needs Review" or "Blocked", complete with behavior flags enforcing required comments or surfacing blocker warnings.
* **Real-time Synchronization:** Because Settings act as a Supabase-powered Source of Truth, creating a new category instantly updates every employee's dropdown interface on the dashboard.

### 4. Granular Administration & Security
* **Zero-Trust Access Model:** Anyone can request access via Magic Link, but accounts sit in a "Pending" quarantine until an Administrator explicitly approves them.
* **Role-Based Access Control (RBAC):** Users are strictly divided into Standard and Admin roles, securely enforced using PostgreSQL Row Level Security (RLS) policies.
* **Project Assignments:** Admins dictate exactly who can bill against which projects with date-bound assignments (active from/until). Non-assigned projects disappear from the user's dropdown to prevent misattributed hours.

---

## 💻 Technical Stack Architecture

Pixel of Effort is built on a modern, ultra-performant edge tech stack designed for speed and maintainability:

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Server-Side Rendering (SSR), Server Components (RSC), and Edge routing for sub-second load times. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety, eliminating entire classes of runtime errors. |
| **Backend & Auth** | [Supabase](https://supabase.com/) | PostgreSQL database, Authentication (Magic Link), Server-side Cookies, and RLS security. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) | Rapid, beautiful UI development adhering to strict, premium design aesthetics. |
| **Validation** | [Zod](https://zod.dev/) | Strict schema definitions and payload validation before any data touches the database. |

---

## 🔄 Core Workflows

### The New Employee Journey
1. **Sign-In:** The user visits the portal and requests a secure Magic Link via their work email.
2. **Quarantine:** The user logs in but sees a "Pending Access" screen. They can take no further action.
3. **Approval:** An Administrator navigates to the **Users** panel and approves the account. The user now has standard access.

### The Administration Flow
1. **Setup Core Configs:** The Admin navigates to `/admin/settings` to define company-wide categories and statuses.
2. **Project Creation:** The Admin navigates to `/admin/projects` to initialize a new billing code or project.
3. **Assignments:** From the project panel, the Admin assigns team members to the project and sets an active tracking window.
4. **Monitoring:** The Admin uses the dashboards and Calendar view (in `All Users` scope) to monitor collective billable hour volume against active projects.

---

## 🚀 Deployment & Installation

Because Pixel of Effort relies largely on Vercel and Supabase cloud infrastructure, deploying for production is incredibly streamlined.

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com).
2. Inside Supabase Studio, navigate to the **SQL Editor**, and run the migration files located in `supabase/migrations/` (sequentially) to build your database schema, insert seed data, and enact Security policies.

### 2. Local Environment Variables
Create a `.env.local` file at the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Running Locally
```bash
# Install packages
npm install

# Check TypeScript / Linter locally
npm run typecheck
npm run lint

# Start development server
npm run dev
```
Navigate to `http://localhost:3000`.

### 4. Production Deployment (Vercel)
The project is optimized for a zero-config deployment to Vercel:
1. Connect your GitHub repository to Vercel.
2. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Hit **Deploy**. The environment will compile optimally with Next.js specific caching and Edge functionality out-of-the-box.
