# StayTrack - Frontend

## 📊 React Frontend for Hostel Management System

### 🚀 Quick Start

```bash
npm install
npm start
```

App opens at: http://localhost:3000

### 📁 Project Structure

```
src/
├── App.js                    Main router component
├── App.css                   Global styles
├── index.js                  React entry point
└── components/
    ├── Auth/
    │   └── LoginPage.js      User authentication
    ├── Owner/
    │   ├── OwnerDashboard.js Main dashboard
    │   ├── OwnerOverview.js   Statistics display
    │   ├── OwnerComplaints.js All complaints
    │   ├── OwnerPayments.js   Payment tracking
    │   └── OwnerPendingStudents.js Unpaid students
    ├── Warden/
    │   ├── WardenDashboard.js Main dashboard
    │   ├── WardenStudents.js  Student management
    │   ├── WardenRooms.js     Room inventory
    │   ├── WardenComplaints.js Complaint handling
    │   └── WardenPayments.js  Payment confirmation
    └── Student/
        ├── StudentDashboard.js Main dashboard
        ├── StudentProfile.js   User profile
        ├── StudentComplaints.js Issue submission
        └── StudentPayments.js  Rent payment
```

### 🔑 Demo Credentials

- **Owner**: owner / owner@123
- **Warden**: warden / warden@123
- **Student**: Create via Warden dashboard

### 🎨 Features

✅ Role-based dashboards (Owner, Warden, Student)
✅ Real-time data updates
✅ Responsive design
✅ Form validation
✅ Error handling

### ⚙️ Environment

Backend must be running on: `http://localhost:5000`

API endpoints: `/api/*`

### 📦 Dependencies

- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.14.0
- axios: ^1.5.0
