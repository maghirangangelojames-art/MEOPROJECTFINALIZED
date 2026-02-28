# 🏗️ BUILDING PERMIT SYSTEM - FEATURES

## 📋 MAIN PAGES
1. Home Page - Landing/dashboard
2. Application Form - Submit new building permit applications
3. Submission Confirmation - Confirmation after application submission
4. Track Application - Public application tracking
5. Staff Dashboard - Admin panel for staff to manage applications
6. Application Detail - View full application details
7. System Report - Analytics and reporting
8. Login/OAuth - Authentication redirect (Google/OAuth)
9. 404 Page - Error handling

---

## 🔐 AUTHENTICATION & SECURITY
- OAuth login (Google)
- Role-based access control:
  - User - Regular applicants
  - Staff - Can manage applications
  - Admin - Full system control
- Protected routes with authentication guards
- Cookie-based session management

---

## 📝 APPLICATION FEATURES

### Application Submission
- Applicant name, email, phone
- Applicant capacity (Owner, Contractor, Architect, etc.)
- Owner name (for authorized representatives)
- Barangay selection
- Property location and address
- Property address (detailed)
- Project type (Residential, Commercial, etc.)
- Project scope description
- Building classification
- File/document attachments (PDF, JPEG, JPG)
- Automatic reference number generation (PERMIT-YYYY-XXXXX)

### Application Tracking & Status
- Status types: pending, approved, for_resubmission, on_hold, pending_resubmit
- Processing days calculation
- Status indicators (green/yellow/red based on processing time)
- FIFO ordering by submission date

### Staff Application Management
- View all applications with FIFO ordering
- Filter by status
- Search applications by various fields
- Update application status
- Add staff remarks and notes
- Track processing days and SLA status

### Document Management
- Upload multiple attachments (PDF, JPEG)
- File lock/unlock by staff
- Add file-specific remarks
- Delete file remarks
- Supabase storage integration for file uploads

### Resubmission Workflow
- Request applicant resubmission
- Applicant can update application info during resubmission
- Applicant can upload revised documents
- Preserve file lock status and remarks during resubmission
- Track resubmission count and history

---

## 📊 ACTIVITY & AUDIT LOGGING
- Track staff actions: submitted, approved, on_hold, resubmission_requested, viewed
- Staff member tracking (name, email, ID)
- Detailed action remarks
- Timestamp for all activities
- Searchable activity history per application

---

## 🔔 NOTIFICATIONS & COMMUNICATION
- Email notification system
- Notification types: submitted, approved, on_hold, resubmission_requested
- Delivery status tracking: pending, sent, failed, bounced
- Recipient tracking
- Notification templates (subject and body)
- Tracking sent date and time

---

## 🎨 UI COMPONENTS

### Layout Components
- Dashboard layout with sidebar/navigation
- Dashboard skeleton loader (loading states)
- Page transitions with animations
- Error boundary for error handling
- Responsive design for mobile

### Interactive Components
- Accordion (collapsible sections)
- Alert dialogs (confirmations)
- Alerts (notifications)
- Aspect ratio containers
- Avatars (user profiles)
- Checkboxes
- Collapsible sections
- Context menus
- Dropdowns
- Hover cards
- Labels
- Navigation menus
- Popovers
- Progress bars
- Radio buttons
- Scroll areas
- Separators
- Sliders
- Switches
- Tabs
- Toggles
- Tooltips
- Embedded Map component
- Notification bell icon
- Theme toggle (light/dark)
- AI Chat box

### File Operations
- File edit dialog
- File upload/download
- File lock controls
- File remarks editor

---

## 🔧 TECHNICAL FEATURES

### Database Tables
1. Users - User accounts with OAuth integration
2. Applications - Building permit applications (with APPLICANT_CAPACITY, OWNER_NAME, BARANGAY, etc.)
3. Activity Logs - Audit trail for all staff actions
4. Notifications - Email notification records and delivery status

### File Storage
- Supabase storage integration
- Cloud-based document hosting
- Secure file upload with authentication
- Automatic file sanitization

### API Routes (tRPC)
- Authentication (me, logout)
- Application CRUD operations
- File upload
- Application list/search/filter
- Status updates
- File management (lock, remarks, delete)
- Resubmission workflow
- Activity log retrieval

### Frontend Features
- React 19 with TypeScript
- Responsive layout with Tailwind CSS
- Form validation with React Hook Form + Zod
- State management with TanStack Query
- Real-time notifications with Sonner
- Map integration (Google Maps)
- Voice transcription support
- AI chat functionality (Manus)
- PDF generation/reports

---

## 📱 RESPONSIVE FEATURES
- Mobile-optimized layout
- Gesture support for mobile
- Mobile hooks for responsive behavior
- Touch-friendly UI components

---

## 🌐 DEPLOYMENT & CONFIGURATION
- Vite build system
- Railway/Render deployment ready
- PostgreSQL database
- Environment variable configuration
- Development mode with watch
- Production build optimization

---
