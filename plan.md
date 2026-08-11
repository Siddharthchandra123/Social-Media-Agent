# SOCIAL MEDIA AI AGENT — BACKEND AUDIT + PRODUCT ARCHITECTURE PLAN

## 1. CURRENT ARCHITECTURE

The backend is built using **FastAPI**, **SQLAlchemy (Async)**, **Alembic**, **Pydantic v2**, **Celery + Redis** (scaffolded/partially wired), and **Google Gemini SDK**. 

The directory structure is organized around domain modules:
- `app/api/routes/`: Endpoints for auth, content generation, posts, scheduling, and health.
- `app/services/`: Business logic services (`content_service.py`, `post_service.py`).
- `app/agents/`: Autonomous/generative abstractions (`content_agent.py`).
- `app/db/models/`: SQLAlchemy models (`User`, `SocialAccount`, `Post`, `Generation`, `Candidate`, `Contents`).
- `app/publishing/`: Platform-specific publishing implementations (`linkedin.py`, `mock.py`, `base.py`).
- `app/auth/`: JWT issuance and validation, route dependencies.
- `app/llm/`: Gemini client integration and prompt engineering templates.

---

## 2. WHAT ACTUALLY WORKS

1. **Health Check & Basic Routing**: FastAPI app starts, middleware and routers load correctly.
2. **Database Migrations Engine**: Alembic is initialized with multiple version steps tracking schema evolution.
3. **Gemini Content Generation Service**: The `ContentAgent` successfully prompts Gemini, parses candidate responses, and saves generations and candidates to the database.
4. **LinkedIn & Facebook OAuth Login Flow (Partial Backend)**: 
   - OAuth redirect generation and state validation via cookies are implemented.
   - Token exchange and user profile retrieval work for both platforms.
   - User auto-provisioning/upserting by email works during OAuth callbacks.
5. **LinkedIn Publishing**: Direct REST API posting (`https://api.linkedin.com/rest/posts`) is implemented and structured correctly.

---

## 3. WHAT IS HALF-COOKED

1. **Facebook Pages Integration**: The callback successfully queries `/me/accounts` and prints the payload (`print("PAGES:", pages)`), but **does not save Facebook Page Access Tokens** or allow selecting a specific Page to tie to a `SocialAccount`. It stores the user token instead of the page token needed for publishing.
2. **Multi-User Account Isolation on Content & Posts**: While foreign keys exist (`user_id`), many endpoints do not strictly filter queries by the authenticated user, leading to potential IDOR vulnerabilities.
3. **Celery Worker & Background Publishing**: Celery app and tasks are defined, but worker scheduling/beat is not robustly wired into application startup or API execution loops.
4. **Post Lifecycle States**: Draft -> Review -> Approval -> Publishing -> Published workflow exists in models and enums, but state transitions lack guardrails and transaction rollback guarantees.

---

## 4. WHAT IS BROKEN

1. **Token Storage & Encryption**: Social access tokens and refresh tokens are stored in **plaintext** in the database (`SocialAccount.access_token`, `refresh_token`).
2. **Facebook Publishing Publisher Class**: There is **no** `FacebookPublisher` implemented under `app/publishing/`. Only `LinkedInPublisher` and `MockPublisher` exist.
3. **Frontend-Backend Auth Sync**: The frontend (`next-frontend`) lacks a consistent session store/JWT persistence layer matching the backend's OAuth cookie/token handoff.
4. **OAuth State Cookie SameSite & Secure Attributes**: In production environments behind proxies (e.g., Render), cookie SameSite/Secure mismatches can break OAuth state validation during redirects.

---

## 5. WHAT IS ONLY SCAFFOLDED

1. **Analytics & Engagement Agents**: No active analytics or automated comment/engagement worker modules exist in `app/analytics/` or `app/agents/` beyond placeholder names.
2. **Scheduling Engine**: `peak_time.py` has static dictionary schedules; cron/Celery beat scheduling for automated posts is purely structural scaffolding.
3. **Workspace/Brand Models**: The app currently lumps everything under `User` directly; workspace and brand management models are entirely missing or unimplemented.

---

## 6. SECURITY ISSUES

1. **Plaintext Secrets**: OAuth access and refresh tokens are stored unencrypted in PostgreSQL.
2. **IDOR / Missing Ownership Verification**: 
   - Endpoints in `content.py` and `posts.py` fetch resources by ID without validating `resource.user_id == current_user.id`.
3. **JWT Secret Fallbacks**: Fallback default strings for `SECRET_KEY` in settings.
4. **CORS Configuration**: Wildcard or overly broad CORS settings in `main.py`.

---

## 7. MULTI-USER / ACCOUNT ARCHITECTURE PROBLEMS

- **Direct User-to-SocialAccount coupling**: Users connect personal profiles, but businesses/creators often manage multiple brands or pages (e.g., 3 Facebook Pages, 2 LinkedIn Company Pages) under a single user login.
- **Missing Brand / Workspace Layer**: Without a `Brand` or `Workspace` abstraction, content context (tone, voice, target audience) is tied globally to the user rather than specific projects or clients.

---

## 8. PROPOSED DATABASE ARCHITECTURE

To support a true multi-tenant SaaS, evolve the schema to:

```
User (id, email, password_hash, is_active)
 │
 └── Workspace (id, name, owner_id)
      │
      └── Brand (id, workspace_id, name, tone, target_audience)
           │
           ├── SocialAccount (id, brand_id, platform, platform_account_id, access_token [encrypted], refresh_token, token_expires_at)
           │
           ├── ContentGeneration (id, brand_id, prompt, status)
           │    └── ContentCandidate (id, generation_id, text, platform)
           │
           └── Post (id, brand_id, social_account_id, content, status, scheduled_for, published_at)
```

---

## 9. PROPOSED SOCIAL ACCOUNT ARCHITECTURE

- **Unified OAuth Handler**: Abstract OAuth routes into a common state and exchange flow.
- **Entity Discovery**: 
  - LinkedIn: Fetch personal profile + Administered Organization IDs.
  - Facebook: Fetch user token -> call `/me/accounts` -> store each Page as an individual publishable `SocialAccount` with its specific `page_access_token`.
- **Token Management**:
  - Encrypt all tokens at rest using Fernet symmetric encryption.
  - Store `token_expires_at` with automatic refresh logic before publishing jobs execute.

---

## 10. REQUIRED FRONTEND CHANGES

1. **Authentication & Session Provider**: Add persistent JWT token storage in HttpOnly cookies or secure local storage with Axios/Fetch interceptors.
2. **Onboarding & Workspace/Brand Selector**: Add screens to create a Brand context before generating content.
3. **Connected Accounts Dashboard**: UI to connect/disconnect LinkedIn and Facebook Pages with status indicators.
4. **Content Review & Post Scheduler UI**: Clean up Kanban/List views for drafts, scheduled posts, and published history tied to specific brands.

---

## 11. MVP DEFINITION

The leanest complete MVP:
1. **Auth**: Email/Password or OAuth User Login with JWT.
2. **Brands**: Single default brand per user upon signup.
3. **Social Connection**: Connect LinkedIn & Facebook Pages.
4. **Content Generation**: Input prompt/context -> Gemini generates 3 candidates -> User selects and edits.
5. **Publishing**: Publish immediately to connected LinkedIn or Facebook Page.
6. **History**: View past posts and their statuses.

---

## 12. PHASED IMPLEMENTATION ROADMAP

- **PHASE 0 — Security & Multi-Tenant Cleanup**: Add token encryption, enforce strict user/brand ownership filters on all queries, fix IDOR vulnerabilities.
- **PHASE 1 — Brand & Workspace Refactoring**: Introduce `Brand` model and migrate `SocialAccount`, `ContentGeneration`, and `Post` to belong to a Brand.
- **PHASE 2 — Finish Facebook Integration**: Store Facebook Page Access Tokens correctly, implement `FacebookPublisher`.
- **PHASE 3 — Content Generation Hardening**: End-to-end tests for generation, candidate selection, and persistence.
- **PHASE 4 — Immediate Publishing & Post Lifecycle**: Finalize publish service with error handling and status updates.
- **PHASE 5 — Frontend Integration**: Connect frontend UI to updated multi-tenant backend APIs.

---

## 13. TESTING PLAN

- Unit tests for token encryption/decryption.
- API integration tests verifying **User A receives 404** when attempting to access User B's content generation, posts, or social accounts.
- OAuth state validation and forgery rejection tests.
- Mocked Gemini generation failure tests.

---

## 14. DEFINITION OF DONE

### LinkedIn / Facebook Integration:
- [ ] OAuth flow completes with state validation.
- [ ] Page/Account discovery stores correct scoped access tokens.
- [ ] Tokens are encrypted at rest.
- [ ] Unauthorized access to accounts returns 403/404.
- [ ] Live publishing successfully transmits posts and returns post URLs.

### Content Generation:
- [ ] Prompts generate candidates via Gemini.
- [ ] Generations are strictly scoped to the user's brand.
- [ ] Empty or failed LLM responses are gracefully handled.

---

## 15. EXACT NEXT 10 TASKS

1. Implement Fernet token encryption utility for social tokens (`app/security/encryption.py`).
2. Add `brand_id` foreign key and relationship to `SocialAccount`, `ContentGeneration`, and `Post` models.
3. Create Alembic migration script for the new brand and ownership schema.
4. Refactor `app/api/routes/content.py` to enforce strict ownership filtering (`where(ContentGeneration.brand_id == ...)`).
5. Refactor `app/api/routes/posts.py` to enforce strict ownership filtering on posts and social accounts.
6. Complete Facebook callback logic in `app/api/routes/auth.py` to store individual Facebook Pages and their Page Access Tokens.
7. Implement `FacebookPublisher` class in `app/publishing/facebook.py` using Graph API POST requests.
8. Add comprehensive integration tests verifying User A cannot access User B's generations or posts (`tests/test_authorization.py`).
9. Update `app/services/post_service.py` to route publishing requests to the correct platform publisher (`LinkedInPublisher` or `FacebookPublisher`).
10. Add automated test for OAuth state mismatch and expired token handling.
