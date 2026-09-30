# 🎓 Student Scholarship Monitoring and Academic Compliance System

A web-based system that helps a Scholarship Office register scholars, collect semester grade submissions, verify them, and automatically evaluate compliance against each scholarship program's own requirements.

Built for the **Systems Analysis and Design – Scholarship Monitoring System Laboratory**.

| | |
|---|---|
| **Live System** | https://dums0907-max.github.io/scholarships-monitoring-system/ |
| **Repository** | https://github.com/YOUR-USERNAME/YOUR-REPO](https://github.com/dums0907-max/scholarships-monitoring-system |
| **Developer(s)** | JAMES BLADEMYR DUM |
| **Course / Section** | BSIT-3B

---
ACCOUNT EMAIL AND PASSWORD: EMAIL: lalajemsxd@adssu.edu.ph PASSWORD: 090703lala
## Features

- **Authentication** – Login and logout through Supabase Auth. Protected pages are not accessible without signing in.
- **Scholar Management** – Create, read, and update scholar records. Student ID is required and must be unique.
- **Scholarship Programs** – Each program has its own maximum GWA, minimum units, and failing-grade policy (no hard-coded rule).
- **Grade Submission** – Semester submissions with full validation, saved as *Pending*.
- **Verification** – Authorized staff verify pending submissions. A submission cannot be verified twice.
- **Compliance Evaluation** – A verified submission is checked automatically and marked **Compliant** or **With Deficiency**, and the scholar's status is updated.
- **Dashboard** – Live counts of total scholars, pending submissions, verified submissions, compliant scholars, and scholars with deficiency.
- **Search and Filter** – Search by Student ID or name. Filter by scholarship program or scholar status.

## Tech Stack

| Layer | Technology |
|---|---|
| Front end | HTML, CSS, JavaScript |
| Backend | Supabase (PostgreSQL + Authentication + Row Level Security) |
| Source control | Git and GitHub |
| Hosting | GitHub Pages |

## Project Structure

```
├── index.html        Page structure
├── css/style.css     Styling
├── js/config.js      Supabase URL and anon key
├── js/app.js         Application logic
├── schema.sql        Database tables, security policies, sample data
└── README.md
```

## Setup Instructions

### 1. Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `schema.sql`, and click **Run**.
3. Go to **Authentication → Users → Add user**, enter an email and password, and tick **Auto Confirm**. New users get the `staff` role automatically.
4. To create an admin, run: `update profiles set role = 'admin' where id = '<user-id>';`

### 2. Connect the front end
Open `js/config.js` and paste your **Project URL** and **anon public key** from **Project Settings → API**.

### 3. Run locally
Open `index.html` in a browser and sign in.

### 4. Deploy
Push the files to GitHub, then go to **Settings → Pages → Deploy from a branch → main / (root)**.

## Database Structure

| Table | Purpose |
|---|---|
| `profiles` | Linked to Supabase Auth users. Holds the role: admin, staff, or scholar. |
| `scholarship_programs` | Program name, required GWA, minimum units, failing-grade policy, active flag. |
| `scholars` | Student ID (unique), name, degree program, year level, scholarship, status. |
| `grade_submissions` | Scholar, academic year, semester, GWA, units, failed and incomplete subjects, submission status, evaluation result, verifier and timestamps. |

Relationships: `scholars.scholarship_id → scholarship_programs.id`, `grade_submissions.scholar_id → scholars.id`, `grade_submissions.verified_by → profiles.id`.

## Compliance Rule (BR-05, BR-07)

The system uses the Philippine grading scale, where **1.0 is the highest grade and 5.0 is failing**, so a *lower* GWA is better.

A verified semester submission is **COMPLIANT** when all of these are true:

1. `GWA ≤ program's required GWA`
2. `units enrolled ≥ program's minimum units`
3. `failing grades are allowed by the program OR failed subjects = 0`

Otherwise the result is **WITH DEFICIENCY**. Only *verified* submissions are evaluated.

## Requirements Traceability

| Requirement | Use Case | Business Rule | Implemented Feature |
|---|---|---|---|
| FR-01 | Register Scholar | BR-01 | Scholars form |
| FR-02 | Assign Scholarship | BR-01 | Program dropdown in the scholar form |
| FR-03 | Configure Scholarship Requirements | BR-02 | Scholarship Programs module |
| FR-04 | Submit Grades | BR-03 | Grade Submission form |
| FR-05 | Submit Grades | BR-03 | Academic year and semester fields (unique per scholar) |
| FR-06 | Verify Grade Submission | BR-04, BR-09 | Verify button (staff and admin only) |
| FR-07 | Evaluate Academic Compliance | BR-05, BR-06, BR-07 | `evaluate()` compliance logic |
| FR-08 | Record Deficiency | BR-06 | "With Deficiency" result |
| FR-09 | Update Scholar Status | BR-07 | Automatic status update after evaluation |
| FR-10 | View Dashboard | – | Pending Submissions count on the dashboard |

## Functional Test Results

| ID | Scenario | Expected Result | Actual Result |
|---|---|---|---|
| TC-01 | Login with valid authorized account | Dashboard opens | ☐ Pass ☐ Fail |
| TC-02 | Create scholar with complete data | Scholar saved | ☐ Pass ☐ Fail |
| TC-03 | Create scholar without Student ID | Submission rejected | ☐ Pass ☐ Fail |
| TC-04 | Submit semester grades | Record saved as Pending | ☐ Pass ☐ Fail |
| TC-05 | Verify pending grade submission | Status becomes Verified | ☐ Pass ☐ Fail |
| TC-06 | Evaluate scholar meeting requirements | Result is Compliant | ☐ Pass ☐ Fail |
| TC-07 | Evaluate scholar failing a requirement | Result is With Deficiency | ☐ Pass ☐ Fail |
| TC-08 | Search scholar by Student ID or name | Matching scholar displayed | ☐ Pass ☐ Fail |
| TC-09 | Filter by scholarship or status | Correct subset displayed | ☐ Pass ☐ Fail |
| TC-10 | Open deployed URL | System is accessible online | ☐ Pass ☐ Fail |


## Security Notes

- Row Level Security is enabled on every table. Only `admin` and `staff` users can read or modify records. Only `admin` users can create or edit scholarship programs; staff can view them.
- The anon key in `config.js` is designed to be public. Never commit the `service_role` key or your database password.

## Future Improvements

Scholarship renewal processing, document uploads, notifications, advanced reports, and a scholar login portal.
