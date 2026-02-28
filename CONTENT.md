# 📁 BUILDING PERMIT SYSTEM - CONTENT

## 🗄️ DATABASE SCHEMA

### Users Table
- id (serial, primary key)
- openId (varchar unique)
- name (text)
- email (varchar)
- loginMethod (varchar)
- role (enum: user, admin, staff)
- createdAt (timestamp)
- updatedAt (timestamp)
- lastSignedIn (timestamp)

### Applications Table
- id (serial, primary key)
- referenceNumber (varchar unique)
- applicantName (varchar)
- applicantEmail (varchar)
- applicantPhone (varchar)
- applicantCapacity (varchar)
- ownerName (varchar nullable)
- barangay (varchar)
- propertyLocation (text)
- propertyAddress (text)
- projectType (varchar)
- projectScope (text)
- buildingClassification (varchar)
- attachments (jsonb)
- status (enum: pending, approved, for_resubmission, on_hold, pending_resubmit)
- submittedAt (timestamp)
- processedAt (timestamp nullable)
- staffRemarks (text)
- createdAt (timestamp)
- updatedAt (timestamp)

### Activity Logs Table
- id (serial, primary key)
- applicationId (integer)
- staffId (integer)
- staffName (varchar)
- staffEmail (varchar)
- action (enum: submitted, approved, on_hold, resubmission_requested, viewed)
- remarks (text)
- createdAt (timestamp)

### Notifications Table
- id (serial, primary key)
- applicationId (integer)
- recipientEmail (varchar)
- type (enum: submitted, approved, on_hold, resubmission_requested)
- subject (varchar)
- body (text)
- sent (boolean)
- sentAt (timestamp nullable)
- deliveryStatus (enum: pending, sent, failed, bounced)
- createdAt (timestamp)
- updatedAt (timestamp)

---

## 📁 PROJECT STRUCTURE

### Client Side (/client)
- index.html - Entry point
- src/
  - App.tsx - Main app component
  - main.tsx - React entry
  - index.css - Global styles
  - const.ts - Constants
  - pages/ - Page components
  - components/ - Reusable components
  - lib/ - Utilities (trpc client, utils)
  - hooks/ - Custom React hooks
  - contexts/ - React contexts (Theme)
  - _core/ - Core functionality
  - public/ - Static assets

### Server Side (/server)
- db.ts - Database functions
- routers.ts - tRPC route definitions
- storage.ts - File storage logic
- _core/ - Core server logic
  - context.ts - tRPC context
  - cookies.ts - Cookie handling
  - dataApi.ts - Data API calls
  - email.ts - Email service
  - env.ts - Environment config
  - imageGeneration.ts - Image gen
  - llm.ts - LLM integration
  - map.ts - Mapping service
  - notification.ts - Notifications
  - oauth.ts - OAuth handling
  - sdk.ts - SDKs
  - systemRouter.ts - System routes
  - trpc.ts - tRPC setup
  - vite.ts - Vite integration
  - voiceTranscription.ts - Voice-to-text

### Database (/drizzle)
- schema.ts - Database schema
- relations.ts - Table relations
- migrations/ - Migration files

---

## 🚀 KEY ENDPOINTS

### Authentication
- POST /auth/logout - Logout and clear session

### Applications
- GET /applications/list - List all applications (FIFO)
- GET /applications/byStatus - Filter by status
- GET /applications/search - Search applications
- GET /applications/getById - Get single application
- GET /applications/getByRefNumber - Get by reference number (public)
- GET /applications/getMyApplication - Get current user's app
- POST /applications/create - Create new application
- POST /applications/uploadAttachment - Upload files
- PUT /applications/updateStatus - Update status & remarks (staff)
- PUT /applications/updateFileLockStatus - Lock/unlock files (staff)
- PUT /applications/updateFileRemarks - Add file remarks (staff)
- DELETE /applications/deleteFileRemarks - Delete remarks (staff)
- POST /applications/resubmitApplication - Resubmit with new files
- PUT /applications/updateApplicationInfoDuringResubmission - Update app info

### Activity Logs
- GET /activityLogs/getByApplicationId - Get activities for app

---

## 💾 TECH STACK

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Hook Form
- Zod
- TanStack Query
- tRPC

### Backend
- Node.js
- Express
- tRPC
- PostgreSQL
- Drizzle ORM
- Supabase Storage
- Nodemailer
- AWS SDK (S3)

### Deployment
- Railway / Render
- Docker-ready
- Environment-based config

---
