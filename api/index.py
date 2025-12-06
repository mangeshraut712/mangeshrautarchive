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

# CORS Configuration
origins = [
    "https://mangeshraut712.github.io",
    "https://mangeshraut.pro",
    "https://mangeshrautarchive.vercel.app",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
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
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "x-ai/grok-4.1-fast").strip()
API_URL = "https://openrouter.ai/api/v1/chat/completions"
SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://mangeshraut.pro")
SITE_TITLE = os.getenv("OPENROUTER_SITE_TITLE", "AssistMe AI Assistant")

# Startup logging
print("=" * 60)
print("🚀 AssistMe API Starting...")
print(f"   Environment: {os.getenv('VERCEL_ENV', 'local')}")
print(f"   API Key Configured: {'✅ Yes' if OPENROUTER_API_KEY else '❌ NO - WILL FAIL!'}")
print(f"   Default Model: {OPENROUTER_MODEL}")
print(f"   Site URL: {SITE_URL}")
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

SYSTEM_PROMPT = f"""You are AssistMe, an advanced AI assistant for Mangesh Raut's portfolio with iOS 26-level intelligence.

🎯 CORE CAPABILITIES:
1. **Portfolio Expert**: Deep knowledge of Mangesh's professional background, skills, and achievements
2. **Context Awareness**: Remember conversation history and provide coherent multi-turn responses
3. **Smart Suggestions**: Proactively offer relevant follow-up questions
4. **Technical Depth**: Explain complex technical concepts clearly when asked
5. **Professional Tone**: Friendly, enthusiastic, and professional communication

📊 PORTFOLIO SUMMARY:
{json.dumps(PORTFOLIO_DATA, indent=2)}

💡 INTERACTION GUIDELINES:
- **Be Conversational**: Use natural language, acknowledge previous messages
- **Be Specific**: Cite exact numbers, dates, and achievements
- **Be Helpful**: Offer to elaborate or provide related information
- **Be Concise**: Keep responses under 150 words unless detail is requested
- **Be Proactive**: Suggest relevant topics the user might want to explore

🔗 QUICK ACTIONS:
- Resume Download: {PORTFOLIO_DATA['resume_url']}
- Email: {PORTFOLIO_DATA['email']}
- LinkedIn: {PORTFOLIO_DATA['linkedin']}
- GitHub: {PORTFOLIO_DATA['github']}

🎨 RESPONSE STYLE:
- Use emojis sparingly for emphasis (✨, 🚀, 💡)
- Format lists with bullet points
- Highlight key achievements with **bold**
- Keep technical jargon accessible

Remember: You're representing a talented software engineer. Be confident, knowledgeable, and engaging!
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

    # Date
    if "date" in lower or "today" in lower:
        return {
            "answer": f"📅 Today is {now.strftime('%A, %B %d, %Y')}",
            "source": "System",
            "model": "Direct",
            "category": "Utility",
            "confidence": 1.0,
            "runtime": "0ms",
        }

    return None


async def stream_openrouter_response(model: str, messages: List[Dict], session_id: Optional[str] = None) -> AsyncGenerator[str, None]:
    """Enhanced streaming with typing indicators and metadata"""
    print(f"🔄 Streaming from OpenRouter: {model}")
    
    if not OPENROUTER_API_KEY:
        yield json.dumps({"error": "API key not configured", "type": "error"}) + "\n"
        return
    
    # Send typing indicator start
    yield json.dumps({"type": "typing", "status": "start"}) + "\n"
    await asyncio.sleep(0.1)  # Small delay for UI
    
    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
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
                    "max_tokens": 2000,
                    "stream": True,
                    "top_p": 0.9,
                },
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"❌ API Error {response.status_code}: {error_text.decode()}")
                    yield json.dumps({
                        "error": f"API Error: {response.status_code}",
                        "type": "error"
                    }) + "\n"
                    return
                
                # Stop typing indicator
                yield json.dumps({"type": "typing", "status": "stop"}) + "\n"
                
                full_content = ""
                chunk_count = 0
                start_time = time.time()
                
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    
                    data = line[6:]
                    if data == "[DONE]":
                        # Calculate final metrics
                        elapsed = time.time() - start_time
                        tokens_estimate = len(full_content) // 4
                        tokens_per_sec = tokens_estimate / elapsed if elapsed > 0 else 0
                        
                        yield json.dumps({
                            "type": "done",
                            "full_content": full_content,
                            "metadata": {
                                "char_count": len(full_content),
                                "tokens_estimate": tokens_estimate,
                                "elapsed_ms": int(elapsed * 1000),
                                "tokens_per_sec": round(tokens_per_sec, 2),
                                "chunks": chunk_count
                            }
                        }) + "\n"
                        break
                    
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
                        
                        # Stream usage metadata if available
                        if "usage" in json_data:
                            yield json.dumps({
                                "type": "usage",
                                "usage": json_data["usage"]
                            }) + "\n"
                    
                    except json.JSONDecodeError:
                        continue
                
        except httpx.TimeoutException:
            print("⏱️ Request timeout")
            yield json.dumps({
                "error": "Request timeout - please try again",
                "type": "error"
            }) + "\n"
        except Exception as e:
            print(f"❌ Stream error: {str(e)}")
            yield json.dumps({
                "error": f"Streaming error: {str(e)}",
                "type": "error"
            }) + "\n"


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
        print("❌ API key missing")
        raise HTTPException(status_code=500, detail="API key not configured")
    
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


# Serve static files for local development
if os.getenv("VERCEL_ENV") != "production":
    try:
        # Mount the entire src directory to serve all static files (assets, js, manifest, etc.)
        app.mount("/", StaticFiles(directory="src", html=True), name="static")
    except Exception as e:
        print(f"⚠️ Static files skipped: {e}")

# Vercel Serverless Handler
# This is required for Vercel's Python runtime to work with FastAPI
handler = app
