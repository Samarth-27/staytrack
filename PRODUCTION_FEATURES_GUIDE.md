# PRODUCTION FEATURES GUIDE - Sanmati Bhavan Hostel Management System

## 1. STUDENT ARCHIVAL SYSTEM
**Purpose:** Retain historical student data without cluttering active views.

### Features
- **Soft Delete:** Students are marked as "archived" instead of deleted from the database.
- **Data Preservation:** Keeps payment history, complaint records, and audit trail intact.
- **Safety Checks:** The system will block archival if the student has pending payments or open complaints.
- **Reactivation:** Accidental archivals can be undone easily.

### How to Use (Warden)
1. Go to **Student Management**.
2. Identify the student and click **📦 Archive**.
3. Confirm the archival. If they have unpaid dues or open complaints, an error will be displayed and the action will be aborted.
4. To view archived students, toggle **📦 Show Archived**.
5. From the archived list, you can click **✓ Reactivate** to restore the student.

---

## 2. PASSWORD MANAGEMENT SYSTEM
**Purpose:** Manage credentials securely and efficiently.

### Features
- **Secure Generation:** Automatically creates a cryptographically secure 12-character password.
- **Individual Reset:** Resets password for a single user and displays it for sharing.
- **Bulk Reset:** Select multiple students and reset their passwords simultaneously, downloading a `.txt` file with all new credentials.
- **Student Change Password:** (API available) Students can change their passwords given their current password.

### How to Use (Warden)
- **Individual Reset:** Click **🔑 Reset** next to a student's name.
- **Bulk Reset:** Select the checkboxes next to multiple students, then click **🔄 Reset Passwords** at the top. A file `new_credentials.txt` will download.

---

## 3. ADVANCED REPORTING & ANALYTICS
**Purpose:** Provide data-driven insights into hostel operations.

### Features
- **Revenue Report:** Month-by-month breakdown of collected revenue.
- **Payment Report:** Full payment history with status.
- **Student Roster:** Detailed list of all active students.
- **Complaint Analytics:** Status breakdown and statistics of all complaints.
- **Export:** Download any report as JSON for further processing.

### How to Use (Owner)
1. Navigate to the **📈 Reports** tab on the Owner Dashboard.
2. Select the report type (Revenue, Payments, Students, Complaints).
3. Click **📊 Generate Report**.
4. View the statistics and raw data.
5. Click **⬇️ Download JSON** to save the data locally.
