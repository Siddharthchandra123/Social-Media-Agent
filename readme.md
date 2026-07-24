
Folder structure
```
social-media-agent/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│
│   ├── api/
│   │   ├── router.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── brands.py
│   │       ├── content.py
│   │       ├── posts.py
│   │       ├── analytics.py
│   │       ├── comments.py
│   │       └── agent.py
│
│   ├── agents/
│   │   ├── orchestrator.py
│   │   ├── content_agent.py
│   │   ├── scheduler_agent.py
│   │   ├── engagement_agent.py
│   │   └── comment_agent.py
│
│   ├── llm/
│   │   ├── gemini_client.py
│   │   ├── schemas.py
│   │   └── prompts/
│   │
│   ├── tools/
│   │   ├── registry.py
│   │   ├── brand_tools.py
│   │   ├── content_tools.py
│   │   ├── analytics_tools.py
│   │   ├── scheduling_tools.py
│   │   └── social_tools.py
│
│   ├── services/
│   │   ├── content_service.py
│   │   ├── scheduling_service.py
│   │   ├── analytics_service.py
│   │   └── comment_service.py
│
│   ├── integrations/
│   │   ├── base.py
│   │   ├── linkedin.py
│   │   ├── instagram.py
│   │   └── x.py
│
│   ├── analytics/
│   │   ├── engagement.py
│   │   ├── peak_time.py
│   │   └── trends.py
│
│   ├── db/
│   │   ├── session.py
│   │   ├── base.py
│   │   └── models/
│   │
│   ├── schemas/
│   └── workers/
│       ├── celery.py
│       ├── publishing.py
│       └── monitoring.py
│
├── tests/
├── migrations/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```
___________________________________________________________________

Language and structure
| Component       | Choice        |
| --------------- | ------------- |
| Language        | Python 3.12   |
| API             | FastAPI       |
| AI              | Gemini API    |
| Validation      | Pydantic      |
| Database        | PostgreSQL    |
| ORM             | SQLAlchemy 2  |
| Migrations      | Alembic       |
| Cache           | Redis         |
| Background jobs | Celery        |
| Scheduler       | Celery Beat   |
| HTTP            | HTTPX         |
| Auth            | JWT initially |
| Testing         | Pytest        |
| Container       | Docker        |

________________________________________________________________________

Architecture

                         CLIENT / FRONTEND
                                │
                                │ REST / WebSocket
                                ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │      API Layer       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Agent Service      │
                    │   / Orchestrator     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                 │
              ▼                ▼                 ▼
        Content Agent    Scheduler Agent   Engagement Agent
              │                │                 │
              └────────────────┼─────────────────┘
                               │
                         Comment Agent
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Gemini Client     │
                    │ Structured Output + │
                    │   Tool Calling      │
                    └──────────┬───────────┘
                               │
           ┌───────────────────┼────────────────────┐
           │                   │                    │
           ▼                   ▼                    ▼
    Social Connectors     Analytics Engine      Tool Layer
           │                   │                    │
     LinkedIn etc.       Peak Time/Trends      Agent Tools
           │                   │                    │
           └───────────────────┼────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │     PostgreSQL       │
                    │                     │
                    │ Users               │
                    │ Brands              │
                    │ Posts               │
                    │ Metrics             │
                    │ Comments            │
                    │ Agent Runs          │
                    └──────────────────────┘

                       Redis + Worker Queue
                               │
                     Scheduled Posts
                     Metric Collection
                     Comment Monitoring

____________________________________________________________________________

Phase 1 — Foundation: FastAPI project, config/environment management, PostgreSQL, SQLAlchemy, Alembic, health endpoint and Docker Compose.

Phase 2 — Gemini Content Agent: Gemini client → Pydantic structured output → Content Agent → /content/generate → candidate scoring. At this point we'll already have a working AI backend.

Phase 3 — Post lifecycle: drafts → approvals → scheduler → Celery/Redis → publishing interface.

Phase 4 — Analytics: metric snapshots → engagement-rate calculation → peak-time algorithm → trend analysis.

Phase 5 — Community Agent: comment collection → Gemini classification → sentiment/intent → suggested replies → approval workflow.

Phase 6 — Agent Orchestrator: expose all of the above as tools and let Gemini decide how to combine them from natural-language requests.