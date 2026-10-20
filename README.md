# ResQ — AI Study Planner for Deadlines

> **"Your deadlines. A plan. Less panic."**  
> An autonomous AI-powered study scheduler that solves conflict-free timetables for engineering students facing multi-course exam deadlines, daily fixed routines, and variable topic durations. Built as a college AI project using a formal **Constraint Satisfaction Problem (CSP)** with **Backtracking Search**, **Minimum Remaining Values (MRV)** heuristic, and **Forward Checking**.

[![Live Frontend Demo](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://resq-pi.vercel.app/)
[![Live Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://resq-api-gmx2.onrender.com/docs)
[![Python Tests](https://img.shields.io/badge/Tests-20%20Passed-success?style=flat&logo=pytest)](backend/tests)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ Prerequisites & Local Setup Guide

ResQ runs locally on your machine with **zero external database dependencies or cloud credentials required**. Follow the steps below to have both the FastAPI CSP backend and React frontend running locally in minutes.

### 📋 Prerequisites & System Requirements

Before running the project, make sure you have the following installed on your machine:

| Prerequisite | Minimum Required | Recommended | Verification Command | Notes |
|---|---|---|---|---|
| **Python** | `3.10+` | `Python 3.13` | `python --version` | Powers FastAPI REST API & CSP backtracking engine |
| **Node.js** | `18.0+` | `Node v20+` or `v24+` | `node -v` | Powers React 19 + Vite development server |
| **npm** | `9.0+` | `npm 10+` | `npm -v` | Bundled with Node.js for dependency management |
| **Git** | `2.30+` | Latest | `git --version` | For cloning repository and version control |
| **Operating System** | Any modern OS | Windows 10/11, macOS, Linux | PowerShell, Terminal, or Bash |

> [!NOTE]
> No database (PostgreSQL, MySQL, MongoDB) or Docker daemon is required for local development. The CSP solver operates entirely in-memory with ultra-fast search performance (~4ms).

---

### 📥 1. Clone the Repository

Open your terminal or PowerShell and clone the project:

```powershell
git clone https://github.com/Swapnil-kokare/ResQ.git
cd ResQ
```

---

### ⚙️ 2. Start the FastAPI Backend (Port 8000)

The backend provides the CSP backtracking engine, validation logic, and REST API.

1. **Navigate to the `backend` directory:**
   ```powershell
   cd backend
   ```

2. **(Recommended) Create and activate a Python virtual environment:**
   - **On Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **On macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Python dependencies:**
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables (Optional):**
   ```powershell
   # Copy example environment configuration
   cp .env.example .env
   ```
   *(Default settings in `.env.example` allow `http://localhost:5173` for CORS out of the box).*

5. **Start the FastAPI server:**
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

6. **Verify backend is running:**
   - 🟢 **API Root & Status:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - 📖 **Interactive Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - 🩺 **Health Check Endpoint:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 💻 3. Start the React + Vite Frontend (Port 5173)

Open a **second terminal window** in the repository root:

1. **Navigate to the `frontend` directory:**
   ```powershell
   cd frontend
   ```

2. **Install npm dependencies:**
   ```powershell
   npm install
   ```

3. **Configure environment variables (Optional):**
   ```powershell
   # Copy example environment configuration
   cp .env.example .env.local
   ```
   *(By default, Vite's dev server proxies `/api` calls directly to `http://127.0.0.1:8000`).*

4. **Launch the development server:**
   ```powershell
   npm run dev
   ```

5. **Open ResQ in your browser:**
   👉 **`http://localhost:5173/`**

   You will see the green **"Backend Connected"** indicator at the top right, confirming the React frontend is connected to your local CSP backend!

---

### 🧪 4. Verify Installation with Automated Tests

Run the full automated test suite to ensure your local installation is verified:

1. **Run Backend CSP & API Tests (20 Tests):**
   ```powershell
   # From the project root
   python -m pytest backend/tests -v
   ```
   *Expected output: `20 passed in ~2.2s` (verifies MRV heuristics, forward checking, domain pruning, and independent validator).*

2. **Verify Frontend TypeScript Compilation & Build:**
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected output: `✓ built in ~2.5s (0 errors)`.*

---

### 🌐 Live Production Deployments

If you want to test without local installation:
- **Live Web Application (Vercel):** [https://resq-pi.vercel.app/](https://resq-pi.vercel.app/)
- **Live Backend API & Swagger Docs (Render):** [https://resq-api-gmx2.onrender.com/docs](https://resq-api-gmx2.onrender.com/docs)

---

## 🌟 Key Features

- **Interactive College Exam Timetable:** Input official college exam schedules (Subject, Paper Title, Date/Time, Duration, Venue) with live countdown timers (`1d 2h left`, etc.) and a 1-click **"Load Sample Exam Timetable"** preset. The CSP solver treats exams as rigid commitments and automatically binds topic study deadlines to their respective paper dates.
- **Dynamic Subject Proficiency Levels:** Assign Beginner (Weak), Intermediate, or Advanced (Mastered) ratings to subjects; the CSP solver automatically scales study duration, elevates priority, and enforces mandatory reinforcement revisions for weak topics.
- **Conflict-Free CSP Engine:** Models study chunks as discrete decision variables and candidate time slots as finite domains, enforcing zero-overlap hard constraints using MRV and Forward Checking.
- **Fixed Daily Commitments:** Pre-blocks college lectures (e.g. 08:00–14:00), daily sleep schedules (e.g. 22:30–07:00), and meal intervals (lunch, dinner).
- **Mandatory Exam Revision:** Formally enforces revision sessions after core topic study is completed and strictly before the exam deadline.
- **Interactive Drag-and-Drop Timetable with Session Locking:** Move study sessions across days with automatic session locking; inject urgent tasks and unpinned sessions are seamlessly reshuffled.
- **Formatted Document Export (PDF & Word):** One-click export to printable **PDF** or **Word (.doc)** formatted with official exam highlights, time breakdowns, and subject badges.
- **Honest Infeasibility Detection & Bottleneck Root-Cause:** When a workload cannot fit mathematically into the available time before the deadline, ResQ honestly reports the infeasibility, diagnoses the bottleneck, and provides actionable suggestions.
- **Real-Time Algorithm Activity Panel:** Telemetry directly streamed from the backend backtracking engine showing variables selected via MRV, candidate slots evaluated, forward checking domain wipeouts, and backtrack counts.
- **4-Screen Planning Stepper:** Clean separation of concerns across Exam & Routine Setup, Subjects & Proficiency, Interactive Timetable, and AI CSP Activity.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons | Multi-screen workflow, drag-and-drop timetable, document exporter, real-time activity stream |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic v2 | High-performance async REST API, input validation, OpenAPI/Swagger docs |
| **AI / CSP Engine** | Custom Backtracking Solver (`backend/app/solver/`) | MRV variable selection, Degree tie-breaker, Forward Checking, Independent Validator |
| **Testing** | Pytest, FastAPI TestClient, Vitest / TypeScript Build | 20 automated unit & integration tests covering feasible, conflicting, and infeasible cases |

---

## 🧠 AI & CSP Architecture Walkthrough

### 1. CSP Formalization
A Constraint Satisfaction Problem is formally defined as a triplet: $\langle X, D, C \rangle$:

1. **Variables ($X$):**
   - Each study topic $T_i$ with duration $H_i$ is decomposed into continuous study chunks:
     $$\{ V_{i,1}, V_{i,2}, \dots, V_{i,k} \}$$
     where each chunk duration $\le \text{max\_chunk\_hours}$ (default: 2.0h).
   - If a topic has `requires_revision = True` or `proficiency = 'beginner'`, an additional revision chunk $V_{i,\text{rev}}$ is created.

2. **Domains ($D$):**
   - The planning horizon is divided into discrete candidate time intervals:
     $$\text{Slot}(d, t_{\text{start}}, t_{\text{end}})$$
   - Initial domain pruning eliminates all candidate slots that:
     - Fall outside the waking window ($t < \text{wake\_time}$ or $t + \text{dur} > \text{sleep\_time}$).
     - Overlap with any fixed routine (college lectures, sleep, meals, college exam papers).
     - End after the topic's deadline or after the subject's college exam date ($t_{\text{end}} > \min(\text{deadline}_i, \text{exam\_date}_i)$).

3. **Hard Constraints ($C$):**
   - **$C_1$ (Pairwise Non-Overlap):** For any two scheduled study sessions $S_a$ and $S_b$:
     $$\text{end}(S_a) + \text{buffer} \le \text{start}(S_b) \quad \lor \quad \text{end}(S_b) + \text{buffer} \le \text{start}(S_a)$$
   - **$C_2$ (Fixed Commitment & Exam Immunity):** No session overlaps college lectures, sleep, meals, or official college exam hours.
   - **$C_3$ (Deadline & Exam Compliance):** $\text{end}(S) \le \text{deadline}(T)$.
   - **$C_4$ (Sequential Chunk Ordering):** Part $k$ must complete before Part $k+1$ can begin:
     $$\text{end}(V_{i,k}) \le \text{start}(V_{i,k+1})$$
   - **$C_5$ (Revision Precedence):** Revision session must occur *after* all study chunks for that subject finish and *before* the exam.
   - **$C_6$ (Locked Session Invariance):** In replan mode, pinned sessions must retain their exact assigned start and end slots.

### 2. Search Strategy & Heuristics
- **Minimum Remaining Values (MRV) Heuristic:**
  The solver always picks the unassigned variable with the smallest remaining candidate domain ($|D(V_i)|$). This principle of "fail-first" detects dead ends at the earliest possible depth.
- **Degree Heuristic Tie-Breaker:**
  When multiple variables have identical domain sizes, the solver picks the variable with the highest priority weight, earliest deadline, and largest duration.
- **Forward Checking (FC):**
  When variable $V_i$ is tentatively assigned slot $S$, the solver immediately prunes conflicting intervals from the domains of all unassigned variables. If any variable's domain becomes empty ($\emptyset$), a domain wipeout is registered and the solver backtracks immediately without exploring futile subtrees.

---

## 📁 Project Folder Structure

```
Ai-demo/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entrypoint, CORS & documentation
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py           # Pydantic v2 data models & request/response schemas
│   │   ├── solver/
│   │   │   ├── __init__.py
│   │   │   ├── csp.py               # CSP variables, time intervals & domain generation
│   │   │   ├── backtracking.py      # Backtracking engine with MRV & Forward Checking
│   │   │   └── validator.py         # Independent hard constraint validator (0 violations check)
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── routes.py            # Endpoints: /generate, /replan, /validate, /demo/scenarios
│   │       └── demo_data.py         # Built-in scenarios: Feasible, Urgent Task, Infeasible
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_models.py           # Pydantic input validation tests
│   │   ├── test_csp_solver.py       # CSP engine tests (MRV, chunking, locking, infeasibility)
│   │   ├── test_validator.py        # Independent constraint certification tests
│   │   └── test_api.py              # FastAPI REST endpoint integration tests
│   └── requirements.txt             # Python dependencies (fastapi, uvicorn, pydantic, pytest)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navigation header with live backend status badge
│   │   │   ├── ScenarioDemoBar.tsx  # Preset scenario buttons (Feasible, Urgent, Impossible)
│   │   │   ├── DashboardStats.tsx   # Exam countdown, study hours & feasibility indicator
│   │   │   ├── CollegeExamManager.tsx # Official university exam papers, countdowns & venues
│   │   │   ├── TimetableGrid.tsx    # Drag-and-drop schedule, lock controls, PDF/Word export
│   │   │   ├── TaskSubjectManager.tsx # Topic CRUD, exam quick-link chips & proficiency assessment
│   │   │   ├── RoutineConstraintManager.tsx # Sleep, college, meals & slot size settings
│   │   │   ├── InfeasibilityAlert.tsx # Clear bottleneck analysis & student recovery suggestions
│   │   │   └── AlgorithmActivityPanel.tsx # Live CSP solver telemetry & step-by-step trace
│   │   ├── services/
│   │   │   └── api.ts               # Typed REST API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions matching backend schemas
│   │   ├── App.tsx                  # 4-screen stepper orchestration & workflow manager
│   │   ├── main.tsx                 # React DOM mount point
│   │   └── index.css                # Tailwind CSS styling & custom scrollbars
│   ├── package.json                 # React, Vite, Tailwind v4, Lucide React dependencies
│   ├── vite.config.ts               # Vite configuration with API proxy
│   └── index.html                   # HTML entrypoint with Inter typography & metadata
├── IMPLEMENTATION_STATUS.md         # Living development checklist & verification tracker
└── README.md                        # Documentation & College Presentation Guide
```

---

## 🎤 5-Minute Live College Presentation Script

Use this script during your AI demonstration to impress examiners and faculty:

### Minute 0:00 – 1:00: Problem Statement & Motivation
> *"Good morning, professors. Engineering students frequently struggle with scheduling exam study loads around fixed college schedules, meals, and sleep. Traditional linear calendars either overlap or don't account for variable topic durations and mandatory revision before exams.*  
> *We built **ResQ** — an AI study planner that models scheduling as a formal **Constraint Satisfaction Problem (CSP)** solved using backtracking search with the **Minimum Remaining Values (MRV)** heuristic and **Forward Checking**."*

### Minute 1:00 – 2:00: Scenario 1 — Certified Feasible Plan
> *(Click the **"1. Feasible Study Plan"** button at the top)*  
> *"Here is our base scenario from the presentation: 6 topics totaling 13.5 hours of study, Day 1 and 2 blocked by college from 8 AM to 2 PM, sleep daily from 10:30 PM to 7 AM, and a morning exam on Day 4.*  
> *Notice that within 4 milliseconds, ResQ's CSP engine generated a complete timetable with zero hard-constraint violations. It automatically divided Calculus (3 hours) into two 1.5-hour chunks, scheduled college and meals as fixed blocks, and placed the Full Mock Revision on Day 3 right before the exam."*

### Minute 2:00 – 3:00: Scenario 2 — Dynamic Replanning with Urgent Tasks
> *(Click the **"2. Add Urgent Task & Replan"** button)*  
> *"Now, suppose a professor announces a surprise Operating Systems test on Day 2. We inject a 2-hour high-priority OS topic.*  
> *Instead of starting from scratch, ResQ triggers dynamic replanning. If the student has already locked any preferred sessions using the lock toggle, those stay pinned. The solver reshuffles the remaining topics to guarantee the urgent task finishes before Day 2 night while maintaining all constraints."*

### Minute 3:00 – 4:00: Scenario 3 — Honest Infeasibility Detection
> *(Click the **"3. Impossible / Overconstrained"** button)*  
> *"A critical requirement of reliable AI is honest boundary detection. In Scenario 3, we request 36 study hours within an overconstrained 2-day window having only 12 free hours.*  
> *Notice ResQ does not fabricate a conflicting schedule. Instead, it alerts: 'Mathematically Infeasible Schedule Detected', reports the bottleneck root cause (36.0h required vs. 12.0h capacity), lists all unscheduled tasks, and provides 4 actionable suggestions (such as extending the horizon or shortening topic durations)."*

### Minute 4:00 – 5:00: Solver Telemetry & CSV Export
> *(Scroll down to the **"CSP Solver Execution Trace"** panel)*  
> *"Every single step shown here comes directly from our backend CSP engine. Examiners can filter by 'MRV Selection' to see how variables with the fewest remaining candidate slots were prioritized, and 'Pruned / Wipeouts' to see Forward Checking preventing useless searches.*  
> *Finally, the student can click **'Export CSV'** to download their timetable directly to an offline spreadsheet."*

---

## 📊 Verification & Test Summary

| Test Domain | Target | Result | Evidence |
|---|---|---|---|
| **Pydantic Validation** | Inverted times, negative hours, malformed datetimes | **PASSED** | 6/6 tests passed in `test_models.py` |
| **CSP Backtracking Engine** | MRV variable selection, topic chunking, forward checking wipeouts | **PASSED** | 8/8 tests passed in `test_csp_solver.py` |
| **Hard Constraint Validator** | Zero overlaps, zero fixed clashes, deadline verification, revision ordering | **PASSED** | Certified 0 violations in `test_validator.py` |
| **FastAPI REST Endpoints** | `/health`, `/demo/scenarios`, `/generate`, `/replan`, `/validate` | **PASSED** | 5/5 tests passed in `test_api.py` |
| **Frontend Production Build** | TypeScript strict mode, Tailwind CSS v4 bundling | **PASSED** | Vite build: 0 errors in 1.92s |
| **End-to-End Browser Flow** | Live UI navigation, all 3 preset scenarios, CSV export, telemetry | **PASSED** | Recorded in `resq_app_demo_1792435101212.webp` |

---

## 🌐 Production Deployment Guide

ResQ supports multiple deployment modes:

### 1. Unified Docker Deployment (Recommended)
You can run the entire production-grade stack (Frontend with Nginx + Backend with Uvicorn) using Docker Compose:

```bash
docker compose up --build
```
- Frontend will be accessible at: `http://localhost:80`
- Backend API will be accessible at: `http://localhost:8000`

---

### 2. Cloud Platform Deployment (Free Tier Friendly)

#### A. Backend Deployment (Render / Railway / Fly.io)
1. Push this repository to your GitHub account.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service** connected to your repo.
3. Configure the following settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `ALLOWED_ORIGINS=*` (or your frontend domain URL).
5. Copy your deployed backend URL (e.g. `https://resq-api.onrender.com`).

#### B. Frontend Deployment (Vercel / Netlify)
1. In [Vercel](https://vercel.com), import your `ResQ` GitHub repository.
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://<YOUR_RENDER_BACKEND_URL>/api`
4. Click **Deploy**. Vercel will automatically use `vercel.json` to handle SPA rewrites.

---

## 📜 License
MIT License. Created for the College AI Engineering Project.
