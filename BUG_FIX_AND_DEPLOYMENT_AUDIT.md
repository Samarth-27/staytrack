# StayTrack Full-Stack Bug Fix & Deployment Audit Report

This report documents all bugs identified and resolved across the StayTrack repository for production deployment on **Render (Backend)** and **Vercel (Frontend)**.

---

## Executive Summary of Corrections

| # | Component / File | Issue Category | Root Cause | Fix Applied |
|---|---|---|---|---|
| **1** | [wardenExtendedRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/wardenExtendedRoutes.js) | **Critical Security** | Missing `verifyToken` and `checkRole` middlewares on archival, password resets, and reports | Added middleware protection across all 10 extended endpoints. |
| **2** | [wardenExtendedRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/wardenExtendedRoutes.js) | **Data Integrity** | Querying non-existent field `studentId` in `Payment` and `Complaint` schemas; mismatched enum `'in_progress'` vs `'in-progress'` | Updated queries to use `student: student._id` and `{ $in: ['open', 'in-progress', 'in_progress'] }`. |
| **3** | [wardenExtendedRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/wardenExtendedRoutes.js) | **Auth / Logic Bug** | User ID was read as `req.user._id`, but JWT payload encodes `userId` | Normalized to `req.user.userId || req.user._id`. |
| **4** | [wardenExtendedRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/wardenExtendedRoutes.js) | **Routing Bug** | `module.exports = router;` was placed above the `/payment/:id/screenshot` route | Moved `module.exports` to the bottom of the file. |
| **5** | [studentRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/studentRoutes.js) | **Runtime Crash** | `Room.findOne()` returned `null` for unassigned rooms; calling `room._id` crashed Node process | Added null checks and return a clean 400 response with guidance. |
| **6** | [wardenRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/wardenRoutes.js) | **Runtime Crash** | `Payment.findById(req.params.id)` accessed `.status` without verifying if payment exists | Added null check returning 404 for invalid/deleted IDs. |
| **7** | [ownerRoutes.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/routes/ownerRoutes.js) | **Financial Discrepancy** | Dashboard aggregate used `{ $sum: 3500 }`, ignoring actual payment amount (8500) and penalties | Updated to dynamic sum `{ $sum: { $add: ["$amount", { $ifNull: ["$penaltyAmount", 0] }] } }`. |
| **8** | [aiAnalyticsService.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/utils/aiAnalyticsService.js) | **Date Bug / Parser** | Used `${month}-31` which caused invalid dates / rollover for 28/30-day months; raw JSON parse without markdown stripping | Used UTC month boundaries (`Date.UTC(year, monthIndex, 1)`) and stripped markdown code blocks. |
| **9** | [aiOcrService.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/utils/aiOcrService.js) & [aiComplaintAnalyzer.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/utils/aiComplaintAnalyzer.js) | **AI Parsing & CastError** | Raw `JSON.parse` broke if LLM output included ` ```json `; invalid OCR date string threw `CastError` | Added regex markdown stripping, date validation, and severity enum normalization. |
| **10** | [server.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/backend/server.js) | **Render Deployment** | Render standard MongoDB variable is `MONGODB_URI`, while app looked only for `MONGO_URI`; restricted CORS | Added `MONGODB_URI` fallback and dynamic CORS allowing Vercel preview/production domains with credentials. |
| **11** | [WardenStudents.js](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/frontend/src/components/Warden/WardenStudents.js) | **Frontend Auth** | `axios.post('/auth/register')` omitted Authorization header; student creation threw 403 Forbidden | Added `{ headers: { Authorization: \`Bearer \${token}\` } }`. |
| **12** | [vercel.json](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/staytrack/frontend/vercel.json) | **Vercel SPA 404** | Missing SPA rewrites config caused 404 error on page refresh or direct navigation | Created `vercel.json` with SPA rewrite to `/index.html`. |

---

## Detailed Breakdown of Each Fix

### 1. Extended Warden & Student Routes Protection & Archival Query Bug
- **Location**: `backend/routes/wardenExtendedRoutes.js`
- **Root Cause**:
  1. The endpoints (`/warden/archive-student/:id`, `/warden/reset-password/:id`, `/student/change-password`, etc.) lacked authentication middleware.
  2. When checking for outstanding student dues before checkout, the queries read:
     ```javascript
     Payment.countDocuments({ studentId: student._id, status: 'pending' });
     Complaint.countDocuments({ studentId: student._id, status: { $in: ['open', 'in_progress'] } });
     ```
     In MongoDB, both `Payment` and `Complaint` models use the field name `student` (referencing `User`), **not** `studentId`. Consequently, the queries returned `0` even when students owed rent, allowing students with debts to be archived.
  3. `Complaint` model defines status enum as `['open', 'in-progress', 'resolved']` (hyphenated). The route was querying `'in_progress'` (underscore), missing active complaints.
  4. In `student/change-password`, `req.user._id` was accessed. The JWT payload signed at login is `{ userId: user._id, ... }`. Therefore, `req.user._id` was `undefined`, and `User.findById(undefined)` failed.
- **Fix**:
  - Attached `verifyToken, checkRole(['warden', 'owner'])` to administrative routes and `verifyToken, checkRole(['student'])` to student routes.
  - Corrected field to `student: student._id`.
  - Added support for both `'in-progress'` and `'in_progress'`.
  - Normalized user ID extraction to `req.user.userId || req.user._id`.
  - Moved `module.exports = router;` to the end of the file so `/payment/:id/screenshot` is registered.

---

### 2. Room Lookups & Null Reference Crash in Student Complaint Creation
- **Location**: `backend/routes/studentRoutes.js`
- **Root Cause**:
  When a student submitted a complaint:
  ```javascript
  const student = await User.findById(req.user.userId);
  const room = await Room.findOne({ roomNumber: student.roomNumber });
  const complaint = new Complaint({
    room: room._id, // If student has no room assigned, room is null -> TypeError: Cannot read properties of null (reading '_id')
    ...
  });
  ```
  If a student account did not have a room assigned, the entire backend request crashed with a 500 error.
- **Fix**:
  Validated `student` and checked if `student.roomNumber` and `room` exist. If unassigned, returned an informative `400 Bad Request` telling the student to contact the warden to allocate a room first.

---

### 3. Payment Update Null-Reference Bug
- **Location**: `backend/routes/wardenRoutes.js`
- **Root Cause**:
  In `PUT /payment/:id`, `Payment.findById(req.params.id)` was called and immediately accessed `existingPayment.status` without a null check. An invalid or deleted payment ID threw an unhandled null dereference exception.
- **Fix**:
  Added null check `if (!existingPayment) return res.status(404).json({ message: 'Payment not found' });` to `PUT /payment/:id`, `/payment/:id/reject`, and `/payment/:id/waive-penalty`.

---

### 4. Owner Dashboard Hardcoded Financial Sum
- **Location**: `backend/routes/ownerRoutes.js`
- **Root Cause**:
  The aggregation pipeline for pending fees contained:
  ```javascript
  const totalPending = await Payment.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: null, total: { $sum: 3500 } } }
  ]);
  ```
  It hardcoded `3500` per invoice. However, StayTrack monthly invoices include mess (Rs 5000) + rent (Rs 3500) = Rs 8500, plus potential late penalties (Rs 100). The metric displayed on the Owner dashboard was significantly lower than actual outstanding amounts.
- **Fix**:
  Updated the aggregation pipeline to sum actual invoice amounts and late fees:
  ```javascript
  { $group: { _id: null, total: { $sum: { $add: ["$amount", { $ifNull: ["$penaltyAmount", 0] }] } } } }
  ```

---

### 5. Date Calculation Rollover in AI Analytics
- **Location**: `backend/utils/aiAnalyticsService.js`
- **Root Cause**:
  The monthly query constructed:
  ```javascript
  createdAt: { 
    $gte: new Date(`${month}-01`), 
    $lt: new Date(`${month}-31T23:59:59.999Z`) 
  }
  ```
  For months with fewer than 31 days (February, April, June, September, November), `new Date('YYYY-MM-31')` rolled over into the next month (e.g., Feb 31 becomes March 2 or 3), pulling incorrect complaint statistics into the executive report.
- **Fix**:
  Replaced with exact UTC month boundaries:
  ```javascript
  const [yearStr, monthStr] = (month || '').split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const monthNum = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
  const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0));
  ```

---

### 6. AI JSON Sanitization & Date CastError
- **Location**: `backend/utils/aiOcrService.js` & `backend/utils/aiComplaintAnalyzer.js`
- **Root Cause**:
  1. Even with `responseMimeType: "application/json"`, Gemini models can sometimes output markdown fences (e.g. ````json ... ````). Calling `JSON.parse(response.text)` directly led to `SyntaxError: Unexpected token '` in JSON`.
  2. In OCR, receipts can produce fuzzy date strings (e.g. `"N/A"` or `"Yesterday"`). Executing `new Date(ocrData.date)` on an unparseable string produced `Invalid Date`, which caused Mongoose to throw `CastError: Cast to date failed`.
- **Fix**:
  - Cleaned markdown code blocks prior to parsing: `response.text.replace(/```json/g, '').replace(/```/g, '').trim()`.
  - Added timestamp validation before saving to Mongoose:
    ```javascript
    let parsedDate = null;
    if (ocrData.date) {
      const d = new Date(ocrData.date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }
    ```
  - Added enum normalization for complaint severity (`['low', 'medium', 'high', 'critical']`).

---

### 7. Render Environment Variable Compatibility & Production CORS
- **Location**: `backend/server.js`
- **Root Cause**:
  - Render and MongoDB Atlas integrations conventionally provide the connection string as `MONGODB_URI`. If set under this standard name, the backend previously defaulted to `localhost:27017` and failed on Render.
  - Static `cors()` configuration did not cleanly negotiate cross-origin credentials with Vercel deployment URLs and preview URLs.
- **Fix**:
  - Added fallback: `const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/staytrack';`.
  - Configured CORS with origin verification supporting Vercel domains (`*.vercel.app`), local development, and credentials.

---

### 8. Frontend Student Registration 403 Forbidden Bug
- **Location**: `frontend/src/components/Warden/WardenStudents.js`
- **Root Cause**:
  The backend endpoint `POST /api/auth/register` requires `verifyToken` and `checkRole(['warden', 'owner'])`. In `WardenStudents.js`, the call was:
  ```javascript
  await axios.post(`${API_URL}/auth/register`, { ...newStudent, role: 'student' });
  ```
  It omitted the Authorization header. As a result, every time a Warden clicked "Create Student", the API responded with `403 No token provided`.
- **Fix**:
  Added the header:
  ```javascript
  await axios.post(
    `${API_URL}/auth/register`, 
    { ...newStudent, role: 'student' }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  ```

---

### 9. Vercel Client-Side Routing 404 on Refresh
- **Location**: `frontend/vercel.json`
- **Root Cause**:
  In a React Single Page Application (SPA), routing is handled client-side by React Router. When deployed on Vercel without a rewrite rule, refreshing any subroute (such as `/dashboard`, `/profile`, `/warden`) resulted in a Vercel `404: NOT_FOUND` error because no physical HTML file existed at that path.
- **Fix**:
  Created `frontend/vercel.json`:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

---

## Deployment & Verification Instructions

### 1. Pushing to Git Repository
Run the following commands in your local terminal:
```bash
git add .
git commit -m "fix: resolve critical security, schema mismatches, CORS, and deployment bugs"
git push origin main
```

### 2. Render (Backend) Environment Variables Checklist
Ensure these variables are set in your **Render Dashboard -> Environment**:
- `PORT`: `5000` (or leave default assigned by Render)
- `MONGODB_URI` or `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/staytrack?retryWrites=true&w=majority`
- `JWT_SECRET`: A secure secret string (e.g., `staytrack-production-super-secret-key-2025`)
- `GEMINI_API_KEY`: Your Google Gemini API key
- `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://staytrack.vercel.app`)

### 3. Vercel (Frontend) Environment Variables Checklist
Ensure these variables are set in your **Vercel Project Settings -> Environment Variables**:
- `REACT_APP_API_URL`: Your Render backend service URL (e.g., `https://staytrack-backend.onrender.com/api`)
