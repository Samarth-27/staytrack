# StayTrack AI Architecture

Welcome to the AI-Powered Hostel Operating System. This document explains how the AI capabilities are integrated into the existing StayTrack infrastructure.

## Core Design Principles
1. **Agentic Architecture:** The AI is not just a chatbot. It is a Central Router that can choose to retrieve knowledge (RAG) or call internal backend APIs (Tool Calling) based on the user's intent.
2. **Backward Compatibility:** All AI features are strictly additive. If the AI service fails or the API key is missing, the core CRUD operations of StayTrack continue to function normally.
3. **Role-Based Access Control (RBAC):** The AI Agent restricts tools based on who is logged in. A Warden cannot ask the AI to calculate overall Owner revenue.

---

## 1. AI Copilots (Chat Widget)
Located in `frontend/src/components/AIChatWidget.js`.
- A floating React component accessible on Warden and Owner dashboards.
- Sends prompts to `POST /api/ai/chat`.
- The `aiRouter.js` processes the request, loads session memory from MongoDB (`AIMemory`), and assigns a role-specific system prompt.

## 2. Tool Calling (Function Calling)
Located in `backend/utils/aiTools.js`.
- The AI has access to `getPendingPayments()`, `getRoomOccupancy()`, and `getRevenueStats()`.
- When the user asks "How many rooms are empty?", the AI triggers `getRoomOccupancy`, receives live MongoDB data, and synthesizes an answer.

## 3. Knowledge Base & RAG
Located in `backend/utils/ragService.js` and `seedKnowledge.js`.
- The database contains a `KnowledgeDocument` collection seeded with hostel policies.
- Every chat prompt runs through a MongoDB `$text` search to retrieve relevant policies and injects them into the LLM context.

## 4. AI Complaint Analyzer
Located in `backend/utils/aiComplaintAnalyzer.js`.
- Triggered asynchronously during `POST /api/student/complaints`.
- The AI reads the complaint title/description and returns a strict JSON payload predicting the `severity`, `suggestedStaff`, and `estimatedResolutionTime`.

## 5. Automated Receipt OCR
Located in `backend/utils/aiOcrService.js`.
- Triggered asynchronously when a student uploads a payment screenshot.
- Uses Gemini Vision (`gemini-2.5-flash`) to parse the image, extract UTR, Bank Name, and Amount, and updates the payment's `ocrDetails`.

## 6. Smart Notifications & Reporting
- **Notifications:** `aiNotificationService.js` queries pending payments and uses the LLM to draft personalized, professional reminder emails, dispatched via Nodemailer.
- **Reporting:** `aiAnalyticsService.js` synthesizes raw data into an Executive Summary. `OwnerAIInsights.js` on the frontend generates a downloadable PDF using `jsPDF`.

---

## Environment Variables
To enable these features, ensure your backend `.env` has:
```
GEMINI_API_KEY=your_google_ai_studio_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```
