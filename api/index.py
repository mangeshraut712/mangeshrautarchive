import os
import json
import time
import asyncio
import secrets
import re
import shutil
import subprocess
from typing import List, Optional, Dict, Any, AsyncGenerator
from urllib.parse import unquote
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from datetime import datetime
from collections import defaultdict

import httpx
from dotenv import load_dotenv

# Personal Intelligence Modules
from api.memory_manager import memory_manager
from api.integrations.github_connector import github_connector

# Load environment variables
load_dotenv()

# Initialize FastAPI with optimizations
app = FastAPI(
    title="AssistMe - AI Portfolio Assistant API",
    description="Next-gen AI chatbot with streaming, context awareness, and iMessage-style features",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add GZip compression for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Configuration — explicit origins only (no wildcard with credentials)
origins = [
    # Production domains
    "https://mangeshraut712.github.io",
    "https://mangeshraut.pro",
    "https://mangeshrautarchive.vercel.app",
    # Development
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["X-Session-ID"],
)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "x-ai/grok-4.1-fast").strip()
API_URL = "https://openrouter.ai/api/v1/chat/completions"
SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://mangeshraut.pro")
SITE_TITLE = os.getenv("OPENROUTER_SITE_TITLE", "AssistMe AI Assistant")

# Startup logging
print("=" * 60)
print("🚀 AssistMe API Starting...")
print(f"   Environment: {os.getenv('VERCEL_ENV', 'local')}")
if OPENROUTER_API_KEY:
    print("   API Key: ✅ Configured (OpenRouter)")
    print(f"   Model: {OPENROUTER_MODEL}")
else:
    print("   API Key: ⚠️  Not configured")
    print("   Mode: 🧠 Local Intelligence (Offline Fallback Active)")
print(f"   Site URL: {SITE_URL}")
print("   Docs: http://localhost:8000/api/docs")
print("=" * 60)

# Rate Limiting
rate_limit_store = defaultdict(list)
RATE_LIMIT_REQUESTS = 20  # requests per window
RATE_LIMIT_WINDOW = 60  # seconds

# Conversation Memory (stores last N messages per session)
conversation_memory = {}
MAX_MEMORY_MESSAGES = 10
MEMORY_EXPIRY = 3600  # 1 hour

# Models - Support multiple models
MODELS = [
    {"id": "x-ai/grok-4.1-fast", "name": "Grok 4.1 Fast", "priority": 1, "streaming": True},
    {"id": "x-ai/grok-2-1212", "name": "Grok 2 (Legacy)", "priority": 2, "streaming": True},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "priority": 3, "streaming": True},
]
DEFAULT_MODEL = OPENROUTER_MODEL or "x-ai/grok-4.1-fast"

# Portfolio Data - Enhanced
PORTFOLIO_DATA = {
    "name": "Mangesh Raut",
    "title": "Software Engineer | Full-Stack Developer | AI/ML Engineer",
    "location": "Philadelphia, PA",
    "email": "mbr63@drexel.edu",
    "phone": "+1 (609) 505 3500",
    "linkedin": "linkedin.com/in/mangeshraut71298",
    "github": "github.com/mangeshraut712",
    "website": "https://mangeshraut.pro",
    "resume_url": "/assets/files/Mangesh_Raut_Resume.pdf",
    "summary": (
        "Software Engineer with expertise in Java Spring Boot, Python, AngularJS, AWS, and machine learning. "
        "Currently optimizing energy analytics at Customized Energy Solutions with 40% efficiency gains."
    ),
    "experience": [
        {
            "title": "Software Engineer",
            "company": "Customized Energy Solutions",
            "period": "Aug 2024 - Present",
            "location": "Philadelphia, PA",
            "achievements": [
                "Reduced dashboard latency by 40% through React optimization",
                "Accelerated CI/CD deployments by 35% with Jenkins automation",
                "Improved ML model accuracy by 25% for energy forecasting",
                "Architected scalable microservices with Spring Boot and AWS",
            ],
        },
        {
            "title": "Software Engineer",
            "company": "IoasiZ",
            "period": "Jul 2023 - Jul 2024",
            "location": "Remote",
            "achievements": [
                "Refactored legacy codebase with 20% code reduction",
                "Resolved 50+ critical microservices bugs",
                "Integrated Redis caching for 3x faster data retrieval",
                "Improved network latency by 35%",
            ],
        },
    ],
    "skills": {
        "languages": ["Java", "Python", "SQL", "JavaScript", "TypeScript"],
        "frameworks": [
            "Spring Boot",
            "AngularJS",
            "React",
            "TensorFlow",
            "scikit-learn",
        ],
        "cloud": ["AWS (EC2, S3, Lambda)", "Docker", "Jenkins", "Terraform"],
        "databases": ["PostgreSQL", "MongoDB", "MySQL", "Redis"],
        "tools": ["Git", "Jira", "Tableau", "Wireshark", "Postman"],
    },
    "education": [
        {
            "degree": "Master of Science in Computer Science",
            "school": "Drexel University",
            "period": "2023-2025",
            "gpa": "3.76",
            "status": "Completed",
        },
        {
            "degree": "Bachelor of Engineering in Computer Engineering",
            "school": "Savitribai Phule Pune University",
            "period": "2014-2017",
            "gpa": "3.6",
        },
    ],
    "projects": [
        {
            "name": "Starlight Blogging Website",
            "tech": ["Angular", "Flask", "SQLite"],
            "achievements": "100+ users, authentication, content management",
        },
        {
            "name": "Face Emotion Recognition",
            "tech": ["Python", "OpenCV", "ML"],
            "achievements": "95% accuracy, real-time processing",
        },
        {
            "name": "PC Crime Detector",
            "tech": ["Java", "Database", "Automation"],
            "achievements": "80% breach reduction",
        },
        {
            "name": "AI Portfolio (This Website)",
            "tech": ["HTML/CSS/JS", "FastAPI", "OpenRouter", "Vercel"],
            "achievements": "AI chatbot, agentic actions, PWA, 3D animations",
        },
        {
            "name": "Energy Demand Forecasting",
            "tech": ["Python", "TensorFlow", "LSTM", "AWS"],
            "achievements": "25% ML accuracy improvement, time-series forecasting",
        },
        {
            "name": "Microservices E-Commerce Platform",
            "tech": ["Java", "Spring Boot", "Docker", "Redis"],
            "achievements": "3x faster data retrieval, 50+ bug fixes, microservices architecture",
        },
        {
            "name": "DevVit Reddit Game",
            "tech": ["TypeScript", "Devvit SDK", "WASM"],
            "achievements": "Hackathon submission, browser-based game on Reddit",
        },
        {
            "name": "Sarvam AI Cookbook",
            "tech": ["Next.js", "Python", "Sarvam API"],
            "achievements": "Showcase of Indian-language AI models and examples",
        },
    ],
    "publications": [
        {
            "title": "Analysis of Machine Learning Algorithms for Network Intrusion Detection",
            "venue": "IEEE Conference",
            "year": "2024",
        },
    ],
    "certifications": [
        "AWS Cloud Practitioner",
        "Oracle Certified Java SE Programmer",
        "TensorFlow Developer Certificate",
    ],
    "awards": [
        "Dean's List — Drexel University (3 semesters)",
        "Best Project Award — Pune University CS Department",
    ],
}


SYSTEM_PROMPT = f"""You are AssistMe — a premium AI assistant for Mangesh Raut's professional portfolio. Your responses should feel like reading a beautifully crafted article, not raw code.

## Your Identity
You're an intelligent, conversational AI that answers any question with clarity and depth. You specialize in Mangesh's professional background but can discuss any topic thoughtfully.

## Mangesh Raut — Quick Profile
- Software Engineer at Customized Energy Solutions (Philadelphia, PA)
- Full-Stack Developer with Java Spring Boot, Python, React, Angular expertise
- AI/ML Engineer with TensorFlow and scikit-learn experience
- MS in Computer Science from Drexel University (Completed 2025, GPA 3.76)
- BE in Computer Engineering from Savitribai Phule Pune University (2014-2017, GPA 3.6)
- Key achievements: 40% dashboard latency reduction, 35% faster CI/CD, 25% ML accuracy improvement
- Published: IEEE paper on ML algorithms for network intrusion detection (2024)
- Certifications: AWS Cloud Practitioner, Oracle Certified Java SE, TensorFlow Developer
- Awards: Dean's List (Drexel, 3 semesters), Best Project Award (Pune University)

## Response Style — Write Naturally

CRITICAL: Write naturally flowing prose. Avoid excessive formatting.

✅ GOOD Response Style:
"Mangesh Raut is a Software Engineer based in Philadelphia, currently optimizing energy analytics systems at Customized Energy Solutions. He specializes in Java Spring Boot, Python, and cloud infrastructure with AWS.

His notable achievements include reducing dashboard latency by 40% through React optimization and improving ML forecasting accuracy by 25% using TensorFlow. Previously at IoasiZ, he implemented Redis caching that delivered 3x faster data retrieval.

He completed his Master's in Computer Science at Drexel University with a 3.76 GPA. Interested in his AI projects or work experience?"

❌ BAD Response Style (Avoid This):
"**Mangesh Raut** is a **Software Engineer** | **Full-Stack Developer** | **AI/ML Engineer** with **40%** efficiency gains at **Customized Energy Solutions**. **Key Achievements**: - Reduced dashboard latency **40%** via React..."

## Formatting Rules

1. Use natural paragraphs — not bullet-point overload
2. Bold only 2-3 key terms per response maximum
3. Use bullet points sparingly — only for actual lists of 3+ items
4. Include section headers only for longer responses (100+ words)
5. End with a natural follow-up question when relevant
6. Use emojis minimally — one or two max, and only when they add value

## Professional Data Reference
{json.dumps(PORTFOLIO_DATA, indent=2)}

## How to Handle Different Questions

For "Who is Mangesh?":
Write a warm, professional introduction (2-3 paragraphs). Mention his current role, key skills, major achievements with specific numbers, and education. End with an invitation to learn more about specific areas.

For general questions (science, news, etc.):
Answer directly and helpfully. If there's a natural connection to Mangesh's expertise, mention it briefly at the end — but don't force it.

For technical questions:
Provide clear, accurate explanations. If Mangesh has relevant experience, weave it in naturally without making it feel promotional.

## Tone
- Conversational and intelligent
- Confident but humble
- Helpful without being robotic
- Professional but approachable

Remember: You're having a conversation, not writing documentation. Make every response feel polished and easy to read.
"""


# Request Models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    messages: Optional[List[Dict[str, str]]] = []
    context: Optional[Dict[str, Any]] = {}
    stream: bool = True
    session_id: Optional[str] = None  # For conversation memory
    model: Optional[str] = None  # Allow model selection


class MessageReaction(BaseModel):
    message_id: str
    reaction: str  # emoji reaction


class TypingIndicator(BaseModel):
    session_id: str
    is_typing: bool


# Helper Functions
def get_client_ip(request: Request) -> str:
    """Get client IP for rate limiting"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host if request.client else "unknown"


def check_rate_limit(client_id: str) -> bool:
    """Check if client has exceeded rate limit"""
    now = time.time()
    # Clean old entries
    rate_limit_store[client_id] = [
        timestamp for timestamp in rate_limit_store[client_id]
        if now - timestamp < RATE_LIMIT_WINDOW
    ]

    if len(rate_limit_store[client_id]) >= RATE_LIMIT_REQUESTS:
        return False

    rate_limit_store[client_id].append(now)
    return True


def get_session_memory(session_id: str) -> List[Dict[str, str]]:
    """Get conversation history for session"""
    if session_id not in conversation_memory:
        return []

    memory = conversation_memory[session_id]
    if time.time() - memory.get("last_access", 0) > MEMORY_EXPIRY:
        del conversation_memory[session_id]
        return []

    return memory.get("messages", [])


def update_session_memory(session_id: str, user_msg: str, assistant_msg: str):
    """Update conversation memory"""
    if session_id not in conversation_memory:
        conversation_memory[session_id] = {
            "messages": [],
            "created": time.time(),
            "last_access": time.time()
        }

    memory = conversation_memory[session_id]
    memory["messages"].append({"role": "user", "content": user_msg})
    memory["messages"].append({"role": "assistant", "content": assistant_msg})

    # Keep only last N messages
    if len(memory["messages"]) > MAX_MEMORY_MESSAGES * 2:
        memory["messages"] = memory["messages"][-MAX_MEMORY_MESSAGES * 2:]

    memory["last_access"] = time.time()


# Cache with TTL
response_cache = {}
CACHE_DURATION = 300  # 5 minutes


# Helper Functions
def get_cache_key(message: str, session_id: Optional[str] = None) -> str:
    """Session-aware cache key so personalised context isn't shared between users."""
    base = message.strip().lower()[:100]
    if session_id:
        return f"chat:{session_id[:8]}:{base}"
    return f"chat:anon:{base}"


def get_cached_response(cache_key: str):
    cached = response_cache.get(cache_key)
    if not cached:
        return None

    if time.time() - cached["timestamp"] > CACHE_DURATION:
        del response_cache[cache_key]
        return None

    print(f"🚀 Cache hit: {cache_key}")
    return cached["response"]


def set_cached_response(cache_key: str, response: Dict):
    if not response.get("answer") or len(response["answer"]) < 10:
        return

    response_cache[cache_key] = {
        "response": {**response, "cached": True},
        "timestamp": time.time(),
    }

    # Cleanup old entries
    if len(response_cache) > 100:
        sorted_keys = sorted(
            response_cache.keys(), key=lambda k: response_cache[k]["timestamp"]
        )
        for k in sorted_keys[:50]:
            del response_cache[k]


# Prompt injection guard — patterns that attempt to hijack system behaviour
_INJECTION_PATTERNS = [
    re.compile(r"ignore (all |previous |prior )?instructions?", re.I),
    re.compile(r"you are now", re.I),
    re.compile(r"forget (everything|all|your|previous)", re.I),
    re.compile(r"(system prompt|system message|hidden instructions)", re.I),
    re.compile(r"act as (a |an )?(different|new|another)", re.I),
    re.compile(r"disregard (your|all|any|previous)", re.I),
    re.compile(r"pretend (you are|to be)", re.I),
    re.compile(r"jailbreak", re.I),
    re.compile(r"DAN mode", re.I),
    re.compile(r"<\|.*?\|>", re.I),  # Token injection attempts
]


def is_prompt_injection(message: str) -> bool:
    """Detect common prompt injection attacks."""
    return any(p.search(message) for p in _INJECTION_PATTERNS)


# ─────────────────────────────────────────────
# Structured error envelope helper
# ─────────────────────────────────────────────

def api_error(code: str, message: str, status: int = 400, retry_after: Optional[int] = None) -> HTTPException:
    """
    Return a uniform error envelope:
      { "error": { "code": "...", "message": "...", "retryAfter": N } }
    All endpoints should raise this instead of bare HTTPException.
    """
    detail = {"error": {"code": code, "message": message}}
    if retry_after is not None:
        detail["error"]["retryAfter"] = retry_after
    return HTTPException(status_code=status, detail=detail)


# ─────────────────────────────────────────────
# Adaptive LLM parameters by query intent
# ─────────────────────────────────────────────

_FACTUAL_KEYWORDS = re.compile(
    r"\b(experience|education|skills|projects|contact|resume|cv|location|company|university|degree|gpa|certification|achievement|publication)\b",
    re.I,
)
_CREATIVE_KEYWORDS = re.compile(
    r"\b(write|poem|story|joke|imagine|creative|design|idea|brainstorm)\b",
    re.I,
)


def adaptive_llm_params(message: str) -> dict:
    """
    Return temperature + max_tokens tuned to the detected query intent.
      - Factual / portfolio queries  → low temp (precise, less hallucination)
      - Creative / generative queries → high temp (expressive)
      - Default / general             → balanced
    """
    if _FACTUAL_KEYWORDS.search(message):
        return {"temperature": 0.3, "max_tokens": 1200, "top_p": 0.85}
    if _CREATIVE_KEYWORDS.search(message):
        return {"temperature": 0.85, "max_tokens": 1800, "top_p": 0.95}
    return {"temperature": 0.7, "max_tokens": 1500, "top_p": 0.9}


# ─────────────────────────────────────────────
# GitHub proxy cache (server-side, 10 min TTL)
# ─────────────────────────────────────────────

_github_proxy_cache: Dict[str, Any] = {}
GITHUB_PROXY_TTL = 600  # 10 minutes
GITHUB_PAT = os.getenv("GITHUB_PAT", "").strip()  # Optional fine-grained PAT
_github_api_proxy_cache: Dict[str, Any] = {}
GITHUB_API_PROXY_TTL = 180  # 3 minutes for endpoint-level GitHub API proxy


async def fetch_github_repos_cached(username: str) -> list:
    """Fetch GitHub repos with 10-min server-side cache and optional PAT auth."""
    cache_key = f"gh_repos:{username}"
    entry = _github_proxy_cache.get(cache_key)
    if entry and time.time() - entry["ts"] < GITHUB_PROXY_TTL:
        return entry["data"]

    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_PAT:
        headers["Authorization"] = f"Bearer {GITHUB_PAT}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"https://api.github.com/users/{username}/repos",
            params={"per_page": 100, "sort": "updated"},
            headers=headers,
        )
        if resp.status_code in (403, 429) and not GITHUB_PAT and shutil.which("gh"):
            try:
                gh_run = subprocess.run(
                    ["gh", "api", f"users/{username}/repos?per_page=100&sort=updated"],
                    capture_output=True,
                    text=True,
                    check=True,
                    timeout=12,
                )
                repos = json.loads(gh_run.stdout) if gh_run.stdout else []
            except Exception:
                resp.raise_for_status()
                repos = resp.json()
        else:
            resp.raise_for_status()
            repos = resp.json()

    _github_proxy_cache[cache_key] = {"data": repos, "ts": time.time()}
    return repos


@app.get("/api/github/proxy")
async def github_api_proxy(path: str):
    """
    Lightweight GitHub API passthrough for repo/user endpoints.
    Used by frontend modules to avoid browser-level rate limits and keep
    GitHub data consistent through a single server-side source of truth.
    """
    if not path or not path.strip():
        raise HTTPException(status_code=400, detail="Missing required query param: path")

    normalized_path = unquote(path.strip())
    if not normalized_path.startswith("/"):
        normalized_path = f"/{normalized_path}"

    if len(normalized_path) > 1000:
        raise HTTPException(status_code=400, detail="Path is too long")

    allowed_prefixes = ("/repos/", "/users/")
    if not normalized_path.startswith(allowed_prefixes):
        raise HTTPException(status_code=400, detail="Only /repos/* and /users/* paths are allowed")

    cache_key = f"gh_proxy:{normalized_path}"
    cached = _github_api_proxy_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < GITHUB_API_PROXY_TTL:
        resp = JSONResponse(status_code=cached["status"], content=cached["data"])
        for key, value in cached["headers"].items():
            if value:
                resp.headers[key] = value
        return resp

    target_url = f"https://api.github.com{normalized_path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AssistMe-GitHub-Proxy/1.0",
    }
    if GITHUB_PAT:
        headers["Authorization"] = f"Bearer {GITHUB_PAT}"

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            github_resp = await client.get(target_url, headers=headers)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"GitHub request failed: {str(exc)}")

    # Local-dev rescue path: use authenticated `gh api` when direct API is rate-limited
    # and PAT is not configured. This keeps data accurate during local development.
    if github_resp.status_code in (403, 429) and not GITHUB_PAT and shutil.which("gh"):
        try:
            gh_path = normalized_path.lstrip("/")
            gh_run = subprocess.run(
                ["gh", "api", gh_path],
                capture_output=True,
                text=True,
                check=True,
                timeout=12,
            )
            gh_payload = json.loads(gh_run.stdout) if gh_run.stdout else {}
            proxy_response = JSONResponse(status_code=200, content=gh_payload)
            _github_api_proxy_cache[cache_key] = {
                "ts": time.time(),
                "status": 200,
                "data": gh_payload,
                "headers": {},
            }
            return proxy_response
        except Exception:
            # Fall back to normal GitHub API error payload below.
            pass

    try:
        payload = github_resp.json()
    except ValueError:
        payload = {"message": github_resp.text}

    passthrough_headers = {}
    for key in ("link", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"):
        value = github_resp.headers.get(key)
        if value:
            passthrough_headers[key] = value

    _github_api_proxy_cache[cache_key] = {
        "ts": time.time(),
        "status": github_resp.status_code,
        "data": payload,
        "headers": passthrough_headers,
    }

    response = JSONResponse(status_code=github_resp.status_code, content=payload)
    for key, value in passthrough_headers.items():
        response.headers[key] = value
    return response


def is_resume_query(message: str) -> bool:
    keywords = ["resume", "cv", "download", "curriculum vitae"]
    return any(keyword in message.lower() for keyword in keywords)


def build_context_prompt(message: str, context: Dict = {}) -> str:
    prompt = f"User Question: {message}\n\n"

    if context.get("currentSection"):
        prompt += f"[User is viewing: {context['currentSection']}]\n"

    if context.get("visibleProjects"):
        titles = ", ".join([p.get("title", "") for p in context["visibleProjects"]])
        prompt += f"[Visible projects: {titles}]\n"

    prompt += "\nPlease answer using the portfolio data provided in the system prompt."
    return prompt


async def handle_direct_command(message: str) -> Optional[Dict]:
    """Handle direct commands without AI"""
    lower = message.lower()
    now = datetime.now()

    # Resume download
    if is_resume_query(message):
        return {
            "answer": (
                f"📄 You can download Mangesh's resume here: {PORTFOLIO_DATA['resume_url']}\n\n"
                "Or click the 'Download Resume' button on the homepage!"
            ),
            "source": "Direct",
            "model": "System",
            "category": "Resume",
            "confidence": 1.0,
            "runtime": "0ms",
            "type": "direct",
            "action": {"type": "download", "url": PORTFOLIO_DATA["resume_url"]},
        }

    # Time
    if "time" in lower and "timezone" not in lower:
        return {
            "answer": f"⏰ Current time is {now.strftime('%I:%M %p')}",
            "source": "System",
            "model": "Direct",
            "category": "Utility",
            "confidence": 1.0,
            "runtime": "0ms",
        }

    # Date

    if "date" in lower or "today" in lower:
        return {
            "answer": f"📅 Today is {now.strftime('%A, %B %d, %Y')}. It's a great day to hire a Software Engineer!",
            "source": "System",
            "model": "Direct",
            "category": "Utility",
            "confidence": 1.0,
            "runtime": "0ms",
        }

    return None


def generate_local_response(query: str) -> Dict:
    """Generate a meaningful response based on portfolio data without using an LLM."""
    query = query.lower().strip()

    # Greetings
    if any(g in query for g in ["hello", "hi", "hey", "greetings"]):
        return {
            "answer": "👋 Hello! I'm AssistMe, running in **Local Dev Mode**. I can tell you about Mangesh's experience, skills, projects, and more. What would you like to know?",
            "category": "Greeting",
        }

    # Who is Mangesh
    if "who" in query and ("mangesh" in query or "you" in query):
        return {
            "answer": f"👨‍💻 **{
                PORTFOLIO_DATA['name']}** is a {
                PORTFOLIO_DATA['title']} based in {
                PORTFOLIO_DATA['location']}. He specializes in building scalable backend systems, cloud infrastructure, and AI-powered applications.",
            "category": "About"}

    # Resume/CV
    if "resume" in query or "cv" in query:
        return {
            "answer": f"📄 You can download Mangesh's resume here: {
                PORTFOLIO_DATA['resume_url']}",
            "category": "Resume"}

    # Skills
    if "skill" in query or "stack" in query or "tech" in query or "language" in query:
        langs = ", ".join(PORTFOLIO_DATA["skills"]["languages"])
        frameworks = ", ".join(PORTFOLIO_DATA["skills"]["frameworks"][:4])
        return {
            "answer": f"🛠️ **Technical Stack**:\n• **Languages**: {langs}\n• **Frameworks**: {frameworks}\n• **Cloud**: AWS, Docker, Kubernetes\n• **Databases**: PostgreSQL, MongoDB, Redis",
            "category": "Skills"
        }

    # Projects
    if "project" in query:
        projects_list = "\n".join([f"• **{p['name']}**: {p['achievements']}" for p in PORTFOLIO_DATA["projects"][:3]])
        return {
            "answer": f"🚀 **Key Projects**:\n{projects_list}",
            "category": "Projects"
        }

    # Contact
    if "contact" in query or "email" in query or "hiring" in query or "hire" in query:
        return {
            "answer": f"📫 **Contact Information**:\n• **Email**: {
                PORTFOLIO_DATA['email']}\n• **Phone**: {
                PORTFOLIO_DATA['phone']}\n• **LinkedIn**: {
                PORTFOLIO_DATA['linkedin']}\n• **GitHub**: {
                    PORTFOLIO_DATA['github']}",
            "category": "Contact"}

    # Experience
    if "experience" in query or "job" in query or "work" in query:
        exp_list = "\n".join(
            [f"• **{e['title']}** at {e['company']} ({e['period']})" for e in PORTFOLIO_DATA["experience"][:3]])
        return {
            "answer": f"💼 **Professional Experience**:\n{exp_list}",
            "category": "Experience"
        }

    # Education
    if "education" in query or "degree" in query or "university" in query or "college" in query:
        edu_list = "\n".join(
            [f"• **{e['degree']}** - {e['school']} ({e['period']})" for e in PORTFOLIO_DATA.get("education", [])[:2]])
        return {
            "answer": f"🎓 **Education**:\n{edu_list}" if edu_list else "🎓 Mangesh holds a Master's in Computer Science from Drexel University.",
            "category": "Education"}

    # Achievements
    if "achievement" in query or "award" in query or "accomplishment" in query:
        return {
            "answer": "🏆 **Key Achievements**:\n• Reduced dashboard latency by **40%** at Customized Energy Solutions\n• Built AI systems with **95% accuracy**\n• Architected microservices handling **100+ concurrent users**",
            "category": "Achievements",
        }

    # Default fallback
    return {
        "answer": "👋 I'm running in **Local Dev Mode** (no API key configured).\n\n**Available topics:**\n• Who is Mangesh?\n• Skills & Tech Stack\n• Projects\n• Experience\n• Education\n• Contact Info\n• Resume\n\nWhat would you like to know?",
        "category": "System",
    }


async def stream_openrouter_response(
        model: str, messages: List[Dict], session_id: Optional[str] = None) -> AsyncGenerator[str, None]:
    """Enhanced streaming with robust error handling and retries"""
    print(f"🔄 Streaming from OpenRouter: {model}")

    if not OPENROUTER_API_KEY:
        print("⚠️ No API Key found - activating Local Intelligence Fallback")
        # yield json.dumps({"error": "API key not configured", "type": "error"}) + "\n"

        # Determine user message
        user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "")
                break

        # Generate local response
        fallback = generate_local_response(user_msg)

        # Simulate typing
        yield json.dumps({"type": "typing", "status": "start"}) + "\n"
        await asyncio.sleep(0.6)  # Simulate 'thought' time
        yield json.dumps({"type": "typing", "status": "stop"}) + "\n"

        # Stream the fallback response
        full_text = fallback["answer"]
        chunk_size = 4
        current_pos = 0

        while current_pos < len(full_text):
            chunk = full_text[current_pos:current_pos + chunk_size]
            current_pos += chunk_size
            yield json.dumps({
                "type": "chunk",
                "content": chunk,
                "chunk_id": current_pos // chunk_size
            }) + "\n"
            await asyncio.sleep(0.02)  # Simulate typing speed

        # Send done signal
        yield json.dumps({
            "type": "done",
            "full_content": full_text,
            "metadata": {
                "model": "Local-FastAPI",
                "source": "Local Intelligence",
                "sourceLabel": "Local Dev Mode",
                "category": fallback.get("category", "General"),
                "confidence": 1.0,
                "tokens_estimate": len(full_text) // 4,
                "elapsed_ms": 600
            }
        }) + "\n"
        return

    # Send typing indicator start
    yield json.dumps({"type": "typing", "status": "start"}) + "\n"

    max_retries = 2
    retry_count = 0
    full_content = ""
    chunk_count = 0
    start_time = time.time()

    while retry_count <= max_retries:
        if retry_count > 0:
            print(f"🔄 Retrying stream (attempt {retry_count}/{max_retries})...")
            # Adjust messages to include what we already have if possible,
            # but usually for chat we just want to restart or continue if the API supports it.
            # OpenRouter doesn't easily support "continue", so we just retry the whole thing.
            full_content = ""
            chunk_count = 0

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
                async with client.stream(
                    "POST",
                    API_URL,
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": SITE_URL,
                        "X-Title": SITE_TITLE,
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                        **adaptive_llm_params(
                            next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
                        ),
                    },
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        print(f"❌ API Error {response.status_code}: {error_text.decode()}")
                        yield json.dumps({
                            "error": f"API Error {response.status_code}",
                            "type": "error"
                        }) + "\n"
                        return

                    # Stop typing indicator only once
                    if retry_count == 0:
                        yield json.dumps({"type": "typing", "status": "stop"}) + "\n"

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue

                        data = line[6:]
                        if data == "[DONE]":
                            elapsed = time.time() - start_time
                            tokens_estimate = len(full_content) // 4
                            tokens_per_sec = tokens_estimate / elapsed if elapsed > 0 else 0

                            yield json.dumps({
                                "type": "done",
                                "full_content": full_content,
                                "metadata": {
                                    "model": model,
                                    "source": "OpenRouter",
                                    "sourceLabel": f"OpenRouter ({model.split('/')[-1]})",
                                    "category": "AI Response",
                                    "char_count": len(full_content),
                                    "tokens_estimate": tokens_estimate,
                                    "elapsed_ms": int(elapsed * 1000),
                                    "tokens_per_sec": round(tokens_per_sec, 2),
                                    "chunks": chunk_count
                                }
                            }) + "\n"
                            return  # Success!

                        try:
                            json_data = json.loads(data)
                            content = (
                                json_data.get("choices", [{}])[0]
                                .get("delta", {})
                                .get("content", "")
                            )

                            if content:
                                full_content += content
                                chunk_count += 1
                                yield json.dumps({
                                    "type": "chunk",
                                    "content": content,
                                    "chunk_id": chunk_count
                                }) + "\n"
                        except BaseException:
                            continue

            # If we reach here without return, the stream ended unexpectedly but without an exception
            retry_count += 1
            await asyncio.sleep(0.5)

        except (httpx.RemoteProtocolError, httpx.ReadError, httpx.ReadTimeout) as e:
            print(f"⚠️ Stream connection error: {str(e)}")
            retry_count += 1
            if retry_count > max_retries:
                yield json.dumps({
                    "error": "The neural link was interrupted. Please try rephrasing or refreshing.",
                    "type": "error"
                }) + "\n"
            else:
                await asyncio.sleep(1)  # Wait before retry
        except Exception as e:
            print(f"❌ Critical stream error: {str(e)}")
            yield json.dumps({
                "error": f"Neural error: {str(e)}",
                "type": "error"
            }) + "\n"
            return


async def call_openrouter(model: str, messages: List[Dict]) -> Dict:
    """Non-streaming API call"""
    if not OPENROUTER_API_KEY:
        raise Exception("API key not configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_TITLE,
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1500,
            },
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("choices"):
            raise Exception("Invalid response")

        return {
            "answer": data["choices"][0]["message"]["content"].strip(),
            "usage": data.get("usage"),
            "model": data.get("model", model),
        }


# API Routes
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, req: Request):
    """Enhanced chat endpoint with memory, rate limiting, and streaming"""
    start_time = time.time()
    client_ip = get_client_ip(req)

    # Rate limiting — use structured error envelope
    if not check_rate_limit(client_ip):
        raise api_error(
            code="RATE_LIMITED",
            message="You've sent too many requests. Please wait a moment before trying again.",
            status=429,
            retry_after=RATE_LIMIT_WINDOW,
        )
    print(f"📨 Chat request from {client_ip}: {request.message[:50]}...")

    if not OPENROUTER_API_KEY:
        print("⚠️ No API key - using Local Intelligence fallback")
        # Use local fallback instead of throwing error
        fallback = generate_local_response(request.message)
        elapsed = time.time() - start_time
        return {
            "answer": fallback["answer"],
            "source": "Local Intelligence",
            "model": "Local-FastAPI",
            "category": fallback.get("category", "General"),
            "confidence": 1.0,
            "runtime": f"{int(elapsed * 1000)}ms",
            "type": "local"
        }

    try:
        message = request.message.strip()
        if not message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        # Prompt injection guard
        if is_prompt_injection(message):
            print(f"🛡️  Prompt injection detected from {client_ip}: {message[:80]}")
            return {
                "answer": "I noticed your message contains instructions that try to change my behaviour. I'm here to help you learn about Mangesh's portfolio — feel free to ask me anything about that!",
                "source": "Security",
                "model": "Guard",
                "type": "blocked",
                "confidence": 1.0,
                "runtime": "0ms",
            }

        # Generate session ID if not provided — use cryptographically secure random token
        session_id = request.session_id or secrets.token_hex(8)

        # Check for direct commands
        direct_response = await handle_direct_command(message)
        if direct_response:
            return direct_response

        # Get conversation history: prefer client-provided messages, fallback to server session memory
        if request.messages:
            # Ensure it's max N messages to prevent payload explosion
            history = request.messages[-MAX_MEMORY_MESSAGES * 2:]
        else:
            history = get_session_memory(session_id) if request.session_id else []

        # Build conversation with context
        system_message = {"role": "system", "content": SYSTEM_PROMPT}

        # Add context awareness
        if request.context:
            context_prompt = build_context_prompt(message, request.context)
            user_message = {"role": "user", "content": context_prompt}
        else:
            user_message = {"role": "user", "content": message}

        # Build full conversation: system + history + new message
        conversation = [system_message] + history + [user_message]

        # Select model
        selected_model = request.model or DEFAULT_MODEL
        if selected_model not in [m["id"] for m in MODELS]:
            selected_model = DEFAULT_MODEL

        # Streaming response
        if request.stream:
            async def generate_stream():
                full_response = ""
                async for chunk in stream_openrouter_response(selected_model, conversation, session_id):
                    yield chunk
                    # Extract full content for memory
                    try:
                        data = json.loads(chunk)
                        if data.get("type") == "done":
                            full_response = data.get("full_content", "")
                    except BaseException:
                        pass

                # Update memory after streaming completes
                if full_response and session_id:
                    update_session_memory(session_id, message, full_response)

            return StreamingResponse(
                generate_stream(),
                media_type="application/x-ndjson",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                    "X-Session-ID": session_id
                },
            )

        # Non-streaming response
        response = await call_openrouter(selected_model, conversation)
        runtime = int((time.time() - start_time) * 1000)

        result = {
            "answer": response["answer"],
            "source": "OpenRouter",
            "model": response["model"],
            "session_id": session_id,
            "category": "General",
            "confidence": 0.95,
            "runtime": f"{runtime}ms",
            "usage": response.get("usage"),
            "timestamp": int(time.time() * 1000),
        }

        # Update memory
        if session_id:
            update_session_memory(session_id, message, response["answer"])

        # Cache the response (session-aware key to avoid cross-user pollution)
        cache_key = get_cache_key(message, session_id)
        set_cached_response(cache_key, result)

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            "error": "Internal server error",
            "message": str(e),
            "answer": "⚠️ Something went wrong. Please try again.",
            "source": "Error",
            "model": "None",
        }


@app.get("/api/models")
async def get_models():
    """Get available AI models"""
    return {
        "models": MODELS,
        "default": DEFAULT_MODEL,
        "current": OPENROUTER_MODEL or DEFAULT_MODEL
    }


@app.post("/api/typing")
async def typing_indicator(indicator: TypingIndicator):
    """Handle typing indicators (for future WebSocket support)"""
    return {"status": "received", "session_id": indicator.session_id}


@app.get("/api/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Get conversation history for a session"""
    history = get_session_memory(session_id)
    return {
        "session_id": session_id,
        "messages": history,
        "count": len(history)
    }


@app.delete("/api/conversation/{session_id}")
async def clear_conversation(session_id: str):
    """Clear conversation history"""
    if session_id in conversation_memory:
        del conversation_memory[session_id]
    return {"status": "cleared", "session_id": session_id}


@app.get("/api/resume")
async def get_resume():
    """Serve resume file"""
    resume_path = "src/assets/files/Mangesh_Raut_Resume.pdf"
    if os.path.exists(resume_path):
        return FileResponse(
            resume_path,
            media_type="application/pdf",
            filename="Mangesh_Raut_Resume.pdf",
        )
    raise HTTPException(status_code=404, detail="Resume not found")


@app.get("/api/health")
async def health_check():
    """Enhanced health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "assistme-api",
        "version": "3.0.0",
        "features": {
            "streaming": True,
            "conversation_memory": True,
            "rate_limiting": True,
            "multi_model_support": True,
            "typing_indicators": True,
        },
        "config": {
            "api_key_configured": bool(OPENROUTER_API_KEY),
            "models_available": len(MODELS),
            "default_model": DEFAULT_MODEL,
            "cache_size": len(response_cache),
            "active_sessions": len(conversation_memory),
            "rate_limit": f"{RATE_LIMIT_REQUESTS} req/{RATE_LIMIT_WINDOW}s"
        },
    }


@app.get("/health")
async def health_alias():
    return await health_check()


@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API configuration (API key is masked for security)"""
    # Mask API key - only show first 4 and last 4 characters
    masked_key = "Not configured"
    if OPENROUTER_API_KEY:
        if len(OPENROUTER_API_KEY) > 8:
            masked_key = f"{OPENROUTER_API_KEY[:4]}...{OPENROUTER_API_KEY[-4:]}"
        else:
            masked_key = "***"

    return {
        "status": "ok",
        "message": "Backend is running!",
        "api_key_configured": bool(OPENROUTER_API_KEY),
        "api_key_masked": masked_key,
        "default_model": DEFAULT_MODEL,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "environment": os.getenv("VERCEL_ENV", "local")
    }


@app.get("/api")
async def api_root():
    return {
        "message": "Mangesh Raut Portfolio API v3.0",
        "endpoints": {
            "chat": "/api/chat",
            "contact": "/api/contact",
            "resume": "/api/resume",
            "health": "/api/health",
            "github_repos": "/api/github/repos/public",
            "docs": "/api/docs",
        },
    }


# ============================================================
# GITHUB PROXY  — server-side cache + optional PAT auth
# Replaces the direct browser → api.github.com call in
# github-projects.js which is limited to 60 req/hr unauthenticated.
# With GITHUB_PAT set this endpoint allows 5000 req/hr.
# ============================================================

@app.get("/api/github/repos/public")
async def github_repos_proxy(
    username: str = "mangeshraut712",
    sort: str = "updated",
    limit: int = 20,
    no_forks: bool = True,
):
    """
    Browser-safe proxy for GitHub repos.
    - Applies server-side 10-min cache (no per-IP budget burned)
    - Optionally authenticates with GITHUB_PAT env var (5000 req/hr)
    - Returns only the fields the frontend needs (strips sensitive data)
    """
    try:
        repos = await fetch_github_repos_cached(username)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 403:
            raise api_error("GITHUB_RATE_LIMITED", "GitHub API rate limit hit. Try again in a few minutes.", 503)
        if exc.response.status_code == 404:
            raise api_error("GITHUB_USER_NOT_FOUND", f"GitHub user '{username}' not found.", 404)
        raise api_error("GITHUB_ERROR", f"GitHub API returned {exc.response.status_code}.", 502)
    except httpx.RequestError:
        raise api_error("GITHUB_UNREACHABLE", "GitHub API is unreachable. Please try again.", 503)

    # Sort
    sort_key = {"updated": "pushed_at", "created": "created_at", "stars": "stargazers_count"}.get(sort, "pushed_at")
    repos.sort(key=lambda r: r.get(sort_key) or "", reverse=(sort_key != "stargazers_count"))

    # Filter forks
    if no_forks:
        repos = [r for r in repos if not r.get("fork", False)]

    # Strip unnecessary fields and return lean objects
    def slim(r: dict) -> dict:
        return {
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description"),
            "homepage": r.get("homepage"),
            "html_url": r.get("html_url"),
            "language": r.get("language"),
            "topics": r.get("topics", []),
            "stargazers_count": r.get("stargazers_count", 0),
            "forks_count": r.get("forks_count", 0),
            "open_issues_count": r.get("open_issues_count", 0),
            "watchers_count": r.get("watchers_count", 0),
            "subscribers_count": r.get("subscribers_count", 0),
            "size": r.get("size", 0),
            "license": r.get("license"),
            "default_branch": r.get("default_branch", "main"),
            "updated_at": r.get("updated_at"),
            "created_at": r.get("created_at"),
            "pushed_at": r.get("pushed_at"),
            "fork": r.get("fork", False),
            "archived": r.get("archived", False),
        }

    slim_repos = [slim(r) for r in repos[:limit]]

    rate_header = "authenticated (5000 req/hr)" if GITHUB_PAT else "unauthenticated (60 req/hr)"
    return {
        "success": True,
        "username": username,
        "count": len(slim_repos),
        "data": slim_repos,
        "cache_ttl_seconds": GITHUB_PROXY_TTL,
        "rate_mode": rate_header,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ============================================================
# CONTACT FORM ENDPOINT  (replaces dead-code api/contact.js)
# ============================================================

class ContactMessage(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=200)
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)


@app.post("/api/contact")
async def send_contact_message(payload: ContactMessage, req: Request):
    """Save contact form submission to Firestore via REST API."""
    # Basic email validation
    email_re = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    if not email_re.match(payload.email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    firebase_api_key = os.getenv("GEMINI_FIREBASE_API_KEY") or os.getenv("FIREBASE_API_KEY")
    if not firebase_api_key:
        raise HTTPException(
            status_code=503,
            detail="Contact service not configured. Please email mbr63@drexel.edu directly.")

    project_id = "mangeshrautarchive"
    url = (
        f"https://firestore.googleapis.com/v1/projects/{project_id}"
        f"/databases/(default)/documents/messages?key={firebase_api_key}"
    )

    doc_fields = {
        "fields": {
            "name": {"stringValue": payload.name.strip()},
            "email": {"stringValue": payload.email.strip()},
            "subject": {"stringValue": payload.subject.strip()},
            "message": {"stringValue": payload.message.strip()},
            "timestamp": {"timestampValue": datetime.utcnow().isoformat() + "Z"},
            "userAgent": {"stringValue": req.headers.get("user-agent", "Unknown")},
            "submittedFrom": {"stringValue": req.headers.get("referer") or req.headers.get("origin") or "Direct"},
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=doc_fields)

        if not resp.is_success:
            error_body = resp.text
            print(f"❌ Firestore error {resp.status_code}: {error_body}")
            raise HTTPException(status_code=502,
                                detail="Failed to save message. Please try again or email mbr63@drexel.edu.")

        doc_id = resp.json().get("name", "").split("/")[-1]
        print(f"✅ Contact message saved: {doc_id} from {payload.email}")
        return {"success": True, "message": "Message sent successfully!", "id": doc_id}

    except httpx.RequestError as exc:
        print(f"❌ Network error saving contact: {exc}")
        raise HTTPException(status_code=503, detail="Network error. Please try again.")


# ====================================================================================
# PERSONAL INTELLIGENCE ENDPOINTS (v6.0)
# ====================================================================================

@app.get("/api/github/profile")
async def get_github_profile(username: str = "mangeshraut712"):
    """
    Get live GitHub profile and activity summary

    Returns:
        - User profile
        - Repository statistics
        - Most popular projects
        - Language breakdown
    """
    try:
        activity = await github_connector.get_user_activity_summary(username)

        if 'error' in activity:
            raise HTTPException(status_code=404, detail=activity['error'])

        return {
            "success": True,
            "data": activity,
            "ai_summary": github_connector.generate_github_summary_for_ai(activity),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")


@app.get("/api/github/repos")
async def get_github_repos(
    username: str = "mangeshraut712",
    sort: str = "updated",
    limit: int = 10,
    search: Optional[str] = None
):
    """
    Get user's GitHub repositories with optional filtering

    Args:
        username: GitHub username
        sort: Sort by 'updated', 'created', 'stars'
        limit: Max repos to return
        search: Optional keyword search
    """
    try:
        if search:
            repos = await github_connector.search_user_repos(username, search)
        else:
            repos = await github_connector.get_repositories(username, sort=sort, max_repos=limit)

        return {
            "success": True,
            "count": len(repos),
            "data": repos,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")


@app.get("/api/memory/stats")
async def get_memory_stats():
    """Get memory system statistics"""
    stats = memory_manager.get_stats()
    return {
        "success": True,
        "data": stats,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.post("/api/personalization/preferences")
async def update_user_preferences(
    request: Request,
    preferences: Dict[str, Any]
):
    """
    Update user preferences (GDPR compliant)

    Body:
        {
            "user_id": "optional",
            "preferences": {
                "response_length": "concise" | "detailed",
                "technical_level": "beginner" | "intermediate" | "expert",
                "interests": ["web_dev", "ml", "cloud"],
                "communication_style": "formal" | "casual"
            }
        }
    """
    try:
        user_id = preferences.get('user_id', get_client_ip(request))
        prefs = preferences.get('preferences', {})

        memory_manager.update_preferences(user_id, prefs)

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "user_id": user_id,
            "preferences": prefs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")


@app.get("/api/personalization/greeting")
async def get_personalized_greeting(request: Request, user_id: Optional[str] = None):
    """
    Get personalized greeting based on user history

    Returns context-aware greeting with personalization
    """
    if not user_id:
        user_id = get_client_ip(request)

    greeting = memory_manager.get_personalized_greeting(user_id)
    context = memory_manager.get_context_for_user(user_id)

    return {
        "success": True,
        "greeting": greeting,
        "context": context,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# Serve static files for local development and Cloud Run
# Only skip for Vercel where static files are handled by the framework
vercel_env = os.getenv("VERCEL_ENV")
if vercel_env != "production":
    try:
        # Mount the entire src directory to serve all static files (assets, js, manifest, etc.)
        app.mount("/", StaticFiles(directory="src", html=True), name="static")
        print("📁 Static files mounted from /src directory")
    except Exception as e:
        print(f"⚠️ Static files skipped: {e}")
