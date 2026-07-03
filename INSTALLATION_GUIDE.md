# INSTALLATION & SETUP GUIDE

This guide details how the new features (Archival, Password Management, Reports) were installed and set up.

## 1. Backend Updates
The backend requires `nodemailer` for future email features, and several new files.

### 1.1 Install Dependencies
```bash
cd backend
npm install nodemailer
```

### 1.2 File Changes Made
- `backend/models/User.js`: Added `status` and `archivedDetails` to the schema. Added `archiveStudent()` and `reactivateStudent()` methods.
- `backend/utils/helpers.js`: Added helper functions for secure password generation, report formatting, and email scaffolding.
- `backend/routes/wardenExtendedRoutes.js`: Added endpoints for archival (`/api/warden/archive-student/:id`), password resets, and reports.
- `backend/server.js`: Mounted `wardenExtendedRoutes.js` to `/api`.

### 1.3 Optional Email Configuration
In `backend/.env`, you can add:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@sanmati-bhavan.com
```

---

## 2. Frontend Updates

### 2.1 File Changes Made
- `frontend/src/components/Warden/WardenStudents.js`: Completely overhauled to include Archival, Reactivation, Individual/Bulk Password Resets, and filtering toggles.
- `frontend/src/components/Owner/OwnerReports.js`: A brand new component added to handle the four advanced reports (Revenue, Payments, Students, Complaints) and JSON downloading.
- `frontend/src/components/Owner/OwnerDashboard.js`: Added the "Reports" tab to the navigation and mounted the `OwnerReports` component.

### 2.2 Re-Running the App
Once changes are made, restart both servers.

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```
