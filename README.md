# ResQ — AI Study Planner for Deadlines

> **"Your deadlines. A plan. Less panic."**  
> An autonomous AI-powered study scheduler that solves conflict-free timetables for engineering students facing multi-course exam deadlines, daily fixed routines, and variable topic durations. Built as a college AI project using a formal **Constraint Satisfaction Problem (CSP)** with **Backtracking Search**, **Minimum Remaining Values (MRV)** heuristic, and **Forward Checking**.

---

## 🌟 Key Features

- **Conflict-Free CSP Engine:** Models study chunks as discrete decision variables and candidate time slots as finite domains, enforcing zero-overlap hard constraints.
- **Fixed Daily Commitments:** Pre-blocks college lectures (e.g. 08:00–14:00), daily sleep schedules (e.g. 22:30–07:00), and meal intervals (lunch, dinner).
- **Mandatory Exam Revision:** Formally enforces revision sessions after core topic study is completed and strictly before the exam deadline.
- **Dynamic Replanning with Session Locking:** Inject urgent tasks on any day; existing locked study sessions remain pinned to their exact slots while unpinned sessions are seamlessly reshuffled.
- **Honest Infeasibility Detection & Bottleneck Root-Cause:** When a workload cannot fit mathematically into the available time before the deadline, ResQ honestly reports the infeasibility, diagnoses the bottleneck, and provides actionable suggestions.
- **Real-Time Algorithm Activity Panel:** Telemetry directly streamed from the backend backtracking engine showing variables selected via MRV, candidate slots evaluated, forward checking domain wipeouts, and backtrack counts.
- **Timetable Export:** One-click CSV export of the certified schedule for calendar imports or offline printing.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons | Responsive student dashboard, interactive timetable, real-time activity stream |
| **Backend** | Python 3.13, FastAPI, Uvicorn, Pydantic v2 | High-performance async REST API, input validation, OpenAPI/Swagger docs |
| **AI / CSP Engine** | Custom Backtracking Solver (`backend/app/solver/`) | MRV variable selection, Degree tie-breaker, Forward Checking, Independent Validator |
| **Testing** | Pytest, FastAPI TestClient, Vitest / TypeScript Build | 19 automated unit & integration tests covering feasible, conflicting, and infeasible cases |

---

## 🧠 AI & CSP Architecture Walkthrough

### 1. CSP Formalization
A Constraint Satisfaction Problem is formally defined as a triplet: $\langle X, D, C \rangle$:

1. **Variables ($X$):**
   - Each study topic $T_i$ with duration $H_i$ is decomposed into continuous study chunks:
     $$\{ V_{i,1}, V_{i,2}, \dots, V_{i,k} \}$$
     where each chunk duration $\le \text{max\_chunk\_hours}$ (default: 2.0h).
   - If a topic has `requires_revision = True`, an additional revision chunk $V_{i,\text{rev}}$ is created.

2. **Domains ($D$):**
   - The planning horizon is divided into discrete candidate time intervals:
     $$\text{Slot}(d, t_{\text{start}}, t_{\text{end}})$$
   - Initial domain pruning eliminates all candidate slots that:
     - Fall outside the waking window ($t < \text{wake\_time}$ or $t + \text{dur} > \text{sleep\_time}$).
     - Overlap with any fixed routine (college lectures, sleep, meals, exam).
     - End after the topic's deadline ($t_{\text{end}} > \text{deadline}_i$).

3. **Hard Constraints ($C$):**
   - **$C_1$ (Pairwise Non-Overlap):** For any two scheduled study sessions $S_a$ and $S_b$:
     $$\text{end}(S_a) + \text{buffer} \le \text{start}(S_b) \quad \lor \quad \text{end}(S_b) + \text{buffer} \le \text{start}(S_a)$$
   - **$C_2$ (Fixed Commitment Immunity):** No session overlaps college, sleep, or meals.
   - **$C_3$ (Deadline Compliance):** $\text{end}(S) \le \text{deadline}(T)$.
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
│   │   │   ├── TimetableGrid.tsx    # Color-coded day-wise schedule & CSV exporter
│   │   │   ├── TaskSubjectManager.tsx # Interactive topic CRUD, priorities & revision toggles
│   │   │   ├── RoutineConstraintManager.tsx # Sleep, college, meals & slot size settings
│   │   │   ├── InfeasibilityAlert.tsx # Clear bottleneck analysis & student recovery suggestions
│   │   │   └── AlgorithmActivityPanel.tsx # Live CSP solver telemetry & step-by-step trace
│   │   ├── services/
│   │   │   └── api.ts               # Typed REST API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions matching backend schemas
│   │   ├── App.tsx                  # Root state orchestration & workflow manager
│   │   ├── main.tsx                 # React DOM mount point
│   │   └── index.css                # Tailwind CSS styling & custom scrollbars
│   ├── package.json                 # React, Vite, Tailwind v4, Lucide React dependencies
│   ├── vite.config.ts               # Vite configuration with API proxy
│   └── index.html                   # HTML entrypoint with Inter typography & metadata
├── IMPLEMENTATION_STATUS.md         # Living development checklist & verification tracker
└── README.md                        # Documentation & College Presentation Guide
```

---

## 🚀 How to Run Locally

Both servers run locally without requiring any external accounts, API keys, or databases.

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm** (Tested on Node v24)
- **Windows PowerShell** (or Linux/macOS bash)

---

### Step 1: Start the FastAPI Backend

Open a PowerShell terminal in the project root:

```powershell
# Navigate to the backend directory
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend is now live:
- API Root: `http://127.0.0.1:8000/`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

---

### Step 2: Start the React Frontend

Open a second PowerShell terminal in the project root:

```powershell
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser to:
👉 **`http://localhost:5173/`** (or `http://127.0.0.1:5173/`)

---

### Step 3: Run Automated Tests

To run the complete backend test suite:

```powershell
# Run all 19 pytest tests
python -m pytest backend/tests -v
```

Expected output:
```
======================== 19 passed, 1 warning in 1.66s ========================
```

To run the frontend production build verification:

```powershell
cd frontend
npm run build
```

Expected output:
```
✓ built in 1.92s (0 errors)
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
