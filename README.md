# 🧭 ScoutBase

ScoutBase is a web app for managing Scout attendance, youth records, parent sign-ins, patrol points, and admin reports. It is built with React, Supabase, and styled-components, offering both parent-facing and admin interfaces.

---

## 🚀 Features

- Parent PIN-based sign-in with youth attendance tracking
- Admin dashboard with:
  - Youth & parent management
  - Patrols and inspection scoring
  - Transition tracking (e.g. Invested, Linking)
  - Communication tools (notices/alerts to parents)
  - Section- and role-based access controls
  - Reports: Age, transitions, attendance, engagement

---

## 🧱 Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Auth**: Custom PIN system and Scouts Terrain login for admins
- **Styling**: `styled-components`
- **Charts**: Recharts

---

## 🛠️ Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/scoutbase.git
cd scoutbase
