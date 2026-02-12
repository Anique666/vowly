#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build /dashboard page in Next.js:
  - Fetch wedding details, guests, and vendors from backend APIs
  - Display: Day selector, Guest count per day, Dietary breakdown, Accommodation count, Vendor status
  - Add buttons: "Generate Vendor Brief" → calls /api/ai/generate-vendor-brief, "Draft Vendor Message" → calls /api/ai/chat with context
  - Add AI chatbot panel: Chat UI, Calls /api/ai/chat
  - Style using shadcn/ui components

backend:
  - task: "POST /api/wedding/create endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Existing endpoint, needs integration testing with frontend"
      - working: true
        agent: "testing"
        comment: "✅ PASSED - Successfully creates wedding with proper validation. Tested with 3-day wedding with multiple events. All required field validation working (name required, at least one day, at least one event). Returns proper wedding ID and data structure."

  - task: "POST /api/guest/rsvp endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Existing endpoint, needs integration testing with frontend"
      - working: true
        agent: "testing"
        comment: "✅ PASSED - RSVP endpoint working perfectly. Validates attendingDays length matches wedding days count. Email validation working. Creates guest records successfully. Tested with various scenarios including validation failures."

  - task: "POST /api/email/send-invites endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Existing endpoint using Resend API, needs integration testing"
      - working: true
        agent: "testing"
        comment: "✅ PASSED - Email API endpoint functioning correctly. API responds properly with status, message, emailsSent count, and failed arrays. Note: Using dummy Resend API key so actual emails don't send, but endpoint structure and validation work correctly."

  - task: "GET /api/wedding/{wedding_id} endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Existing endpoint needed for RSVP page to fetch wedding details"
      - working: true
        agent: "testing"
        comment: "✅ PASSED - Wedding retrieval endpoint working correctly. Returns complete wedding data with all days, events, and metadata. Proper 404 error handling for non-existent wedding IDs. Data integrity maintained between create and retrieve operations."

frontend:
  - task: "/dashboard page - Wedding Dashboard"
    implemented: true
    working: true
    file: "frontend/src/app/dashboard/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Implemented dashboard with wedding selector, day tabs, guest stats, dietary breakdown, accommodation count, vendor list with status, AI action buttons, and chat panel"

  - task: "/dashboard page - Day Selector"
    implemented: true
    working: true
    file: "frontend/src/app/dashboard/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Tab-based day selector showing each day with date"

  - task: "/dashboard page - Guest Stats Per Day"
    implemented: true
    working: true
    file: "frontend/src/app/dashboard/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Stats cards showing guests attending, dietary breakdown, accommodation needs"

  - task: "/dashboard page - Vendor Status"
    implemented: true
    working: true
    file: "frontend/src/app/dashboard/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Shows vendor list with confirmed/pending status"

  - task: "/dashboard page - AI Buttons"
    implemented: true
    working: true
    file: "frontend/src/app/dashboard/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Generate Vendor Brief and Draft Vendor Message buttons calling AI endpoints (requires GROQ_API_KEY)"

  - task: "/dashboard page - Chat Panel"
    implemented: true
    working: true
    file: "frontend/src/app/dashboard/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Slide-in chat panel with AI assistant calling /api/ai/chat (requires GROQ_API_KEY)"

  - task: "/host page - Wedding Setup Form"
    implemented: true
    working: true
    file: "frontend/src/app/host/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Implemented with wedding name, location, dates, day-wise events with add/remove functionality"

  - task: "/rsvp page - RSVP Form"
    implemented: true
    working: true
    file: "frontend/src/app/rsvp/page.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Implemented with name, email, attending days checkboxes, dietary radio, accommodation radio"

  - task: "Gold and White Theme"
    implemented: true
    working: true
    file: "frontend/src/app/globals.css"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Theme configured with primary color as gold (hsl 43 96% 56%)"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "/host page - Wedding Setup Form"
    - "/rsvp page - RSVP Form"
    - "/host page - Invite Guests Section"
    - "Toast Notifications"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Implemented /host and /rsvp pages with:
      1. /host page: Wedding setup form with name, location, dates, day-wise events (add/remove days and events), vendors section (optional), save wedding button, invite guests section (appears after saving)
      2. /rsvp page: Fetches wedding details, shows RSVP form with name, email, attending days checkboxes, dietary preference radio, accommodation radio
      3. Gold and white theme throughout
      4. Toast notifications for success/error feedback
      5. Client-side validation implemented
      
      Ready for backend API testing to verify end-to-end flow.
  - agent: "testing"
    message: |
      ✅ BACKEND TESTING COMPLETE - All 4 critical API endpoints are working perfectly:

      🎯 CORE FUNCTIONALITY TESTED:
      1. POST /api/wedding/create - Creates weddings with full validation (name required, days required, events required)
      2. GET /api/wedding/{id} - Retrieves wedding data accurately with proper error handling  
      3. POST /api/guest/rsvp - Processes RSVPs with attendingDays validation matching wedding days
      4. POST /api/email/send-invites - Email API responds correctly (dummy key used, structure validated)

      🔍 VALIDATION TESTING PASSED:
      - Empty wedding name rejection (400 error)
      - No days provided rejection (400 error) 
      - No events provided rejection (400 error)
      - Invalid wedding ID for RSVP (404 error)
      - AttendingDays length mismatch validation (400 error)
      - Non-existent wedding ID lookup (404 error)
      - Health check endpoint functional

      📊 TEST RESULTS: 9/9 test scenarios passed
      Backend APIs are production-ready for frontend integration.