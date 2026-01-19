import os
import json
import time
import asyncio
from typing import List, Optional, Dict, Any, AsyncGenerator
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from collections import defaultdict
import hashlib

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

# CORS Configuration - Allow all deployment environments
origins = [
    # Production domains
    "https://mangeshraut712.github.io",
    "https://mangeshraut.pro",
    "https://mangeshrautarchive.vercel.app",
    
    # Development
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    
    # Allow all for development (remove in strict production)
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash").strip()
API_URL = "https://openrouter.ai/api/v1/chat/completions"
SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://mangeshraut.pro")
SITE_TITLE = os.getenv("OPENROUTER_SITE_TITLE", "AssistMe AI Assistant")

# Startup logging
print("=" * 60)
print("🚀 AssistMe API Starting...")
print(f"   Environment: {os.getenv('VERCEL_ENV', 'local')}")
if OPENROUTER_API_KEY:
    print(f"   API Key: ✅ Configured (OpenRouter)")
    print(f"   Model: {OPENROUTER_MODEL}")
else:
    print(f"   API Key: ⚠️  Not configured")
    print(f"   Mode: 🧠 Local Intelligence (Offline Fallback Active)")
print(f"   Site URL: {SITE_URL}")
print(f"   Docs: http://localhost:8000/api/docs")
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
    {"id": "google/gemini-2.0-flash", "name": "Gemini 2.0 Flash", "priority": 1, "streaming": True},
    {"id": "google/gemini-pro", "name": "Gemini Pro", "priority": 2, "streaming": True},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "priority": 3, "streaming": True},
]
DEFAULT_MODEL = OPENROUTER_MODEL or "google/gemini-2.0-flash"

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
            "status": "In Progress",
        },
        {
            "degree": "Bachelor of Engineering in Computer Engineering",
            "school": "Pune University",
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
    ],
}

SYSTEM_PROMPT = f"""You are AssistMe — a premium AI assistant for Mangesh Raut's professional portfolio. Your responses should feel like reading a beautifully crafted article, not raw code.

## Your Identity
You're an intelligent, conversational AI that answers any question with clarity and depth. You specialize in Mangesh's professional background but can discuss any topic thoughtfully.

## Mangesh Raut — Quick Profile
- Software Engineer at Customized Energy Solutions (Philadelphia, PA)
- Full-Stack Developer with Java Spring Boot, Python, React, Angular expertise
- AI/ML Engineer with TensorFlow and scikit-learn experience
- MS in Computer Science from Drexel University (in progress)
- Key achievements: 40% dashboard latency reduction, 35% faster CI/CD, 25% ML accuracy improvement

## Response Style — Write Naturally

CRITICAL: Write naturally flowing prose. Avoid excessive formatting.

✅ GOOD Response Style:
"Mangesh Raut is a Software Engineer based in Philadelphia, currently optimizing energy analytics systems at Customized Energy Solutions. He specializes in Java Spring Boot, Python, and cloud infrastructure with AWS.

His notable achievements include reducing dashboard latency by 40% through React optimization and improving ML forecasting accuracy by 25% using TensorFlow. Previously at IoasiZ, he implemented Redis caching that delivered 3x faster data retrieval.

He's pursuing his Master's in Computer Science at Drexel University. Interested in his AI projects or work experience?"

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
def get_cache_key(message: str) -> str:
    return f"chat:{message.strip().lower()[:100]}"


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

    # Skills instant response
    if any(k in lower for k in ["skill", "stack", "language", "tech"]):
        skills = ", ".join(PORTFOLIO_DATA["skills"]["languages"] + PORTFOLIO_DATA["skills"]["frameworks"][:3])
        return {
            "answer": (
                f"🛠️ Mangesh's core technical stack includes **{skills}**, along with deep expertise in "
                f"**AWS**, **Docker**, and **Microservices** architecture.\n\n"
                "Would you like to see a specific project where he applied these?"
            ),
            "source": "Neural-Direct",
            "model": "System 4.0",
            "category": "Skills",
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
            "answer": f"👋 Hello! I'm AssistMe, running in **Local Dev Mode**. I can tell you about Mangesh's experience, skills, projects, and more. What would you like to know?",
            "category": "Greeting"
        }
    
    # Who is Mangesh
    if "who" in query and ("mangesh" in query or "you" in query):
        return {
            "answer": f"👨‍💻 **{PORTFOLIO_DATA['name']}** is a {PORTFOLIO_DATA['title']} based in {PORTFOLIO_DATA['location']}. He specializes in building scalable backend systems, cloud infrastructure, and AI-powered applications.",
            "category": "About"
        }
    
    # Resume/CV
    if "resume" in query or "cv" in query:
        return {"answer": f"📄 You can download Mangesh's resume here: {PORTFOLIO_DATA['resume_url']}", "category": "Resume"}
    
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
            "answer": f"📫 **Contact Information**:\n• **Email**: {PORTFOLIO_DATA['email']}\n• **Phone**: {PORTFOLIO_DATA['phone']}\n• **LinkedIn**: {PORTFOLIO_DATA['linkedin']}\n• **GitHub**: {PORTFOLIO_DATA['github']}",
            "category": "Contact"
        }
    
    # Experience
    if "experience" in query or "job" in query or "work" in query:
        exp_list = "\n".join([f"• **{e['title']}** at {e['company']} ({e['period']})" for e in PORTFOLIO_DATA["experience"][:3]])
        return {
            "answer": f"💼 **Professional Experience**:\n{exp_list}",
            "category": "Experience"
        }
    
    # Education
    if "education" in query or "degree" in query or "university" in query or "college" in query:
        edu_list = "\n".join([f"• **{e['degree']}** - {e['school']} ({e['period']})" for e in PORTFOLIO_DATA.get("education", [])[:2]])
        return {
            "answer": f"🎓 **Education**:\n{edu_list}" if edu_list else "🎓 Mangesh holds a Master's in Computer Science from Drexel University.",
            "category": "Education"
        }
    
    # Achievements
    if "achievement" in query or "award" in query or "accomplishment" in query:
        return {
            "answer": f"🏆 **Key Achievements**:\n• Reduced dashboard latency by **40%** at Customized Energy Solutions\n• Built AI systems with **95% accuracy**\n• Architected microservices handling **100+ concurrent users**",
            "category": "Achievements"
        }
        
    # Default fallback
    return {
        "answer": "👋 I'm running in **Local Dev Mode** (no API key configured).\n\n**Available topics:**\n• Who is Mangesh?\n• Skills & Tech Stack\n• Projects\n• Experience\n• Education\n• Contact Info\n• Resume\n\nWhat would you like to know?",
        "category": "System"
    }


async def stream_openrouter_response(model: str, messages: List[Dict], session_id: Optional[str] = None) -> AsyncGenerator[str, None]:
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
        await asyncio.sleep(0.6) # Simulate 'thought' time
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
            await asyncio.sleep(0.02) # Simulate typing speed
            
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
                        "temperature": 0.7,
                        "max_tokens": 1500,
                        "stream": True,
                        "top_p": 0.9,
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
                            return # Success!
                        
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
                        except:
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
                await asyncio.sleep(1) # Wait before retry
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
    
    # Rate limiting
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a moment before trying again."
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
        
        # Generate session ID if not provided
        session_id = request.session_id or hashlib.md5(
            f"{client_ip}{time.time()}".encode()
        ).hexdigest()[:16]
        
        # Check for direct commands
        direct_response = await handle_direct_command(message)
        if direct_response:
            return direct_response
        
        # Get conversation history
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
                    except:
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
        
        # Cache the response
        cache_key = get_cache_key(message)
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
        "message": "Mangesh Raut Portfolio API v2.0",
        "endpoints": {
            "chat": "/api/chat",
            "resume": "/api/resume",
            "health": "/api/health",
            "docs": "/api/docs",
        },
    }


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

