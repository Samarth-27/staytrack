# 🎨 COMPONENT HIERARCHY & DATA FLOW

## 📊 COMPONENT TREE

```
🌳 APPLICATION TREE
│
├─ App.js (Main Router)
│  │
│  ├─ IF NOT LOGGED IN
│  │  └─ LoginPage.js
│  │     ├─ Form (username, password)
│  │     ├─ API Call: POST /auth/login
│  │     └─ Store token & user
│  │
│  └─ IF LOGGED IN
│     └─ Route based on user.role
│        │
│        ├─ IF role = "owner"
│        │  └─ 👑 OwnerDashboard.js
│        │     ├─ Header + Tabs
│        │     ├─ Tab: "Overview" 
│        │     │  └─ OwnerOverview.js
│        │     │     ├─ API: GET /owner/dashboard
│        │     │     └─ Display: 8 stat cards
│        │     │
│        │     ├─ Tab: "Complaints"
│        │     │  └─ OwnerComplaints.js
│        │     │     ├─ API: GET /owner/complaints
│        │     │     ├─ Filter by status
│        │     │     └─ Display: Table with filtering
│        │     │
│        │     ├─ Tab: "Payments"
│        │     │  └─ OwnerPayments.js
│        │     │     ├─ API: GET /owner/payments
│        │     │     ├─ Summary cards
│        │     │     └─ Display: Payments table
│        │     │
│        │     └─ Tab: "Pending Students"
│        │        └─ OwnerPendingStudents.js
│        │           ├─ API: GET /owner/pending-students
│        │           ├─ Calculate days overdue
│        │           └─ Display: Critical report
│        │
│        ├─ IF role = "warden"
│        │  └─ 🔑 WardenDashboard.js
│        │     ├─ Header + Tabs
│        │     ├─ Tab: "Students"
│        │     │  └─ WardenStudents.js
│        │     │     ├─ API: GET /warden/students
│        │     │     ├─ Form: Create new student
│        │     │     │  └─ API: POST /auth/register (role: student)
│        │     │     └─ Display: Students table
│        │     │
│        │     ├─ Tab: "Rooms"
│        │     │  └─ WardenRooms.js
│        │     │     ├─ API: GET /warden/rooms
│        │     │     ├─ Summary cards
│        │     │     └─ Display: Rooms with occupants
│        │     │
│        │     ├─ Tab: "Complaints"
│        │     │  └─ WardenComplaints.js
│        │     │     ├─ API: GET /warden/complaints
│        │     │     ├─ Update status buttons
│        │     │     │  └─ API: PUT /warden/complaint/:id
│        │     │     └─ Display: Complaints with actions
│        │     │
│        │     └─ Tab: "Payments"
│        │        └─ WardenPayments.js
│        │           ├─ API: GET /warden/payments
│        │           ├─ Mark paid button
│        │           │  └─ API: PUT /warden/payment/:id
│        │           └─ Display: Payments with actions
│        │
│        └─ IF role = "student"
│           └─ 📚 StudentDashboard.js
│              ├─ Header + Tabs
│              ├─ Tab: "Profile"
│              │  └─ StudentProfile.js
│              │     ├─ API: GET /student/profile
│              │     ├─ Display: User info
│              │     ├─ Display: Room details
│              │     └─ Display: Roommates
│              │
│              ├─ Tab: "Complaints"
│              │  └─ StudentComplaints.js
│              │     ├─ Form: Submit complaint
│              │     │  ├─ Fields: title, description, category, priority
│              │     │  └─ API: POST /student/complaint
│              │     ├─ Display: My complaints
│              │     └─ API: GET /student/complaints
│              │
│              └─ Tab: "Payments"
│                 └─ StudentPayments.js
│                    ├─ Summary cards
│                    ├─ Form: Make payment
│                    │  ├─ Fields: month, transactionId
│                    │  └─ API: POST /student/payment
│                    ├─ Display: Payment history
│                    └─ API: GET /student/payments
```

---

## 🔄 DATA FLOW EXAMPLES

### Example 1: Student Submits Complaint

```
StudentComplaints.js
    ↓
User fills form:
  - Title: "Water leakage"
  - Description: "...details..."
  - Category: "maintenance"
  - Priority: "high"
    ↓
handleSubmitComplaint()
    ↓
API Call: POST /student/complaint
    ↓
Backend: studentRoutes.js
    ↓
Complaint saved to MongoDB
    ↓
Response: Success
    ↓
refreshComplaints() fetches updated list
    ↓
Display: New complaint appears in table
```

### Example 2: Warden Marks Payment as Paid

```
WardenPayments.js
    ↓
User clicks "Mark Paid" button on pending payment
    ↓
handleMarkPaid(paymentId)
    ↓
API Call: PUT /warden/payment/:id
    ↓
Backend: wardenRoutes.js
    ↓
Payment status updated to "paid"
    ↓
Response: Updated payment object
    ↓
refreshPayments() fetches updated list
    ↓
Display: Payment shows "✓ Confirmed" instead of "Mark Paid"
    ↓
Owner can see updated payment in OwnerPayments.js
```

### Example 3: Owner Views Pending Students

```
OwnerPendingStudents.js
    ↓
Component mounts
    ↓
fetchPendingStudents()
    ↓
API Call: GET /owner/pending-students
    ↓
Backend: ownerRoutes.js
    ↓
Query: All payments with status = "pending"
    ↓
Populate student & room details
    ↓
Sort by createdAt descending
    ↓
Response: Array of pending payment objects
    ↓
setPendingStudents(response.data)
    ↓
Display: Table with:
  - Student name
  - Room number
  - Phone (clickable)
  - Pending month
  - Pending amount
  - Days overdue (calculated)
```

---

## 📡 API CALL FLOW

```
Frontend Component
    ↓
axios.get/post/put(endpoint, { headers: { Authorization: `Bearer ${token}` } })
    ↓
Backend Route (routes/xxxRoutes.js)
    ↓
Middleware: verifyToken() checks JWT
    ↓
Middleware: checkRole() checks permission
    ↓
Route handler executes logic
    ↓
Query/Update Database (MongoDB)
    ↓
Send response back
    ↓
Frontend: setData(response.data)
    ↓
Component re-renders with new data
```

---

## 🔐 SECURITY FLOW

```
User Login:
  LoginPage.js sends username + password
    ↓
  Backend validates credentials
    ↓
  Backend generates JWT token
    ↓
  Frontend stores token in localStorage
    ↓

Every API Call:
  Frontend sends: Authorization: Bearer <token>
    ↓
  Backend middleware: verifyToken()
    ├─ Checks if token exists
    ├─ Decodes JWT
    ├─ Checks expiration
    └─ Extracts user info
    ↓
  Backend middleware: checkRole()
    ├─ Checks user.role
    └─ Allows or denies access
    ↓
  If valid: Execute API logic
  If invalid: Return 403 Unauthorized
```

---

## 📊 STATE MANAGEMENT FLOW

```
Component renders
    ↓
useEffect hook triggers
    ↓
Fetch data from API
    ↓
setState(response.data)
    ↓
Component re-renders with new data
    ↓
User interacts with UI
    ↓
Event handler triggers
    ↓
Make API call
    ↓
setState(updated data)
    ↓
Component re-renders
```

---

## 🗄️ DATABASE STRUCTURE

```
MongoDB Databases:
│
└─ sanmati-bhavan
   │
   ├─ users (Collection)
   │  ├─ _id: ObjectId
   │  ├─ name: "Owner/Warden/Student"
   │  ├─ username: "unique"
   │  ├─ password: "hashed"
   │  ├─ role: "owner|warden|student"
   │  ├─ roomNumber: 101 (for students)
   │  └─ createdAt: Date
   │
   ├─ rooms (Collection)
   │  ├─ _id: ObjectId
   │  ├─ roomNumber: 101
   │  ├─ capacity: 2
   │  ├─ students: [ObjectId, ObjectId]
   │  ├─ rentAmount: 3500
   │  ├─ status: "occupied|vacant"
   │  └─ createdAt: Date
   │
   ├─ payments (Collection)
   │  ├─ _id: ObjectId
   │  ├─ student: ObjectId (ref to User)
   │  ├─ room: ObjectId (ref to Room)
   │  ├─ amount: 3500
   │  ├─ month: "2024-01"
   │  ├─ status: "pending|paid"
   │  ├─ transactionId: "TXN123"
   │  ├─ paidDate: Date
   │  └─ createdAt: Date
   │
   └─ complaints (Collection)
      ├─ _id: ObjectId
      ├─ student: ObjectId (ref to User)
      ├─ room: ObjectId (ref to Room)
      ├─ title: "Water leakage"
      ├─ description: "..."
      ├─ category: "maintenance|cleanliness|utilities|other"
      ├─ status: "open|in-progress|resolved"
      ├─ priority: "low|medium|high"
      ├─ wardenResponse: "..."
      ├─ createdAt: Date
      └─ resolvedAt: Date
```

---

## 🔗 RELATIONSHIP DIAGRAM

```
User (Owner)
├─ Can view: All Complaints, All Payments, Pending Students

User (Warden)
├─ Can create: Students
├─ Can view: All Students, All Rooms, All Complaints, All Payments
├─ Can update: Complaint status, Payment status

User (Student)
├─ Assigned to: One Room
├─ Room contains: 2 Students
├─ Can submit: Complaints
├─ Can make: Payments
└─ Can view: Profile, Complaints, Payments

Room
├─ Has: Students (2 max)
└─ Belongs to: Payments & Complaints

Complaint
├─ Submitted by: Student
├─ About: Room
├─ Updated by: Warden
└─ Viewed by: Owner

Payment
├─ Made by: Student
├─ For: Room
├─ Confirmed by: Warden
└─ Tracked by: Owner
```

---

## ✨ COMPONENT COMMUNICATION

```
OwnerDashboard (Parent)
├─ State: activeTab
├─ Passes: token, user
│
├─ Child: OwnerOverview
│  └─ API Call → MongoDB → Display Stats
│
├─ Child: OwnerComplaints
│  └─ API Call → MongoDB → Display Table
│
├─ Child: OwnerPayments
│  └─ API Call → MongoDB → Display Summary
│
└─ Child: OwnerPendingStudents
   └─ API Call → MongoDB → Display Report
```

---

This modular approach means:
- ✅ Each component is independent
- ✅ Easy to test individual components
- ✅ Easy to modify without breaking others
- ✅ Professional industry standard
- ✅ Scalable for future features

🎉 **Complete, organized, modular architecture!**
