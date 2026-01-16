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
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Initialize FastAPI with optimizations
app = FastAPI(
    title="Antigravity Intelligence - AI Technical Partner API",
    description="Next-gen technical partner for Mangesh Raut, powered by Google Gemini 2.0 Flash",
    version="6.0.0",
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
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "x-ai/grok-4.1-fast").strip()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
API_URL = "https://openrouter.ai/api/v1/chat/completions"
SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://mangeshraut.pro")
SITE_TITLE = os.getenv("OPENROUTER_SITE_TITLE", "AssistMe AI Assistant")

# Configure Google AI
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Startup logging
print("=" * 60)
print("🚀 Antigravity API Starting...")
print(f"   Environment: {os.getenv('VERCEL_ENV', 'local')}")
print(f"   Google AI Key: {'✅ Configured' if GOOGLE_API_KEY else '❌ NOT Configured'}")
print(f"   Persona: Antigravity (Technical Partner)")
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
    {"id": "google/gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash (Labs)", "priority": 1, "streaming": True},
    {"id": "google/gemini-1.5-flash", "name": "Gemini 1.5 Flash", "priority": 2, "streaming": True},
    {"id": "x-ai/grok-4.1-fast", "name": "Grok 4.1 Fast", "priority": 3, "streaming": True},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "priority": 4, "streaming": True},
]
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "google/gemini-2.0-flash-exp")

# Portfolio Data - Enhanced
PORTFOLIO_DATA = {
    "name": "Mangesh Raut",
    "title": "Software Engineer | Full-Stack Developer | AI/ML Engineer",
    "location": "Philadelphia, PA, USA",
    "email": "mbr63@drexel.edu",
    "phone": "+1 (609) 505 3500",
    "linkedin": "linkedin.com/in/mangeshraut71298",
    "github": "github.com/mangeshraut712",
    "website": "https://mangeshraut.pro",
    "resume_url": "/assets/files/Mangesh_Raut_Resume.pdf",
    "summary": (
        "High-performance Software Engineer with 5+ years of experience in building scalable AI-integrated applications. "
        "Specialize in Java Spring Boot, Python, Cloud Infrastructure (AWS), and Machine Learning. "
        "Known for optimizing legacy systems and delivering 40%+ efficiency gains through innovative engineering."
    ),
    "experience": [
        {
            "title": "Software Engineer",
            "company": "Customized Energy Solutions",
            "period": "Aug 2024 - Present",
            "location": "Philadelphia, PA",
            "achievements": [
                "Engineered a real-time energy analytics dashboard that reduced data latency by 45% using React and optimized WebSockets.",
                "Automated CI/CD pipelines using Jenkins and Docker, cutting deployment time from 40 minutes to under 12 minutes.",
                "Implemented LSTM-based forecasting models for energy demand prediction with 92% historical accuracy.",
                "Architected a distributed microservices environment using Java Spring Boot and AWS ECS."
            ]
        },
        {
            "title": "Software Engineer",
            "company": "IoasiZ",
            "period": "Jul 2023 - Jul 2024",
            "location": "Remote",
            "achievements": [
                "Modernized a legacy monolithic system into 15+ microservices, improving system reliability by 60%.",
                "Reduced infrastructure costs by 25% by optimizing AWS resource allocation and implementing serverless Lambda functions.",
                "Enhanced database performance by 3x through refactoring complex SQL queries and implementing Redis caching.",
                "Mentored a team of 4 junior developers on best practices in TypeScript and Clean Architecture."
            ]
        },
        {
            "title": "Student Software Engineer",
            "company": "Aramark",
            "period": "Jan 2022 - Jun 2023",
            "location": "Philadelphia, PA",
            "achievements": [
                "Developed internal automation tools for inventory management, saving 15 staff hours per week.",
                "Maintained and updated web applications using AngularJS and .NET Core."
            ]
        }
    ],
    "skills": {
        "languages": ["Java (Spring Boot Specialist)", "Python (AI/ML Priority)", "SQL", "JavaScript/TypeScript", "Go"],
        "backend": ["Spring Boot", "FastAPI", "Django REST Framework", "Node.js", "Express"],
        "frontend": ["React", "Angular", "Next.js", "Tailwind CSS", "Three.js"],
        "cloud_devops": ["AWS (Certified Cloud Practitioner level)", "Docker", "Kubernetes", "Jenkins", "Terraform", "Google Cloud Platform"],
        "databases": ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Elasticsearch"],
        "ai_ml": ["TensorFlow", "Generative AI (Gemini/GPT Integration)", "OpenCV", "Scikit-learn", "NLP", "LLM Orchestration"]
    },
    "education": [
        {
            "degree": "Master of Science in Computer Science",
            "school": "Drexel University",
            "period": "2023-2025",
            "gpa": "3.76",
            "key_courses": ["Advanced AI", "Cloud Computing", "Distributed Systems", "Software Architecture"]
        },
        {
            "degree": "Bachelor of Engineering in Computer Engineering",
            "school": "Savitribai Phule Pune University",
            "period": "2014-2017",
            "gpa": "3.6/4.0 equivalent"
        }
    ],
    "projects": [
        {
            "name": "AssistMe-VirtualAssistant",
            "tech": ["Python", "Speech Recognition", "Gemini AI", "PyQt5"],
            "description": "An intelligent desktop assistant that performs system actions via voice commands.",
            "technical_wins": [
                "Implemented a custom intent-recognition engine using NLP, achieving 90% command accuracy.",
                "Integrated multi-threaded audio processing to ensure zero-latency voice interaction.",
                "Developed a modular plugin architecture allowing easy extension of assistant capabilities."
            ]
        },
        {
            "name": "Bug-Reporting-System",
            "tech": ["Django REST Framework", "React", "PostgreSQL", "Redis"],
            "description": "Enterprise-grade bug tracking and project management platform.",
            "technical_wins": [
                "Built a high-performance REST API with Django, handling concurrent ticket updates with optimistic locking.",
                "Implemented real-time notifications using WebSockets (Django Channels), reducing communication lag.",
                "Designed a complex RBAC (Role-Based Access Control) system for secure enterprise-wide deployment."
            ]
        },
        {
            "name": "Real-Time-Face-Emotion-Recognition-System",
            "tech": ["Python", "TensorFlow", "Keras", "OpenCV"],
            "description": "Deep learning application that detects 7 different human emotions from video streams.",
            "technical_wins": [
                "Trained a custom CNN (Convolutional Neural Network) from scratch with 94.5% validation accuracy.",
                "Optimized model inference time to <15ms per frame, enabling smooth 60FPS real-time processing.",
                "Solved lightning-variance issues using histogram equalization in the preprocessing pipeline."
            ]
        },
        {
            "name": "Crime-Investigation-System",
            "tech": ["Java", "Swing", "MySQL", "JDBC"],
            "description": "A secure centralized database system for law enforcement case management.",
            "technical_wins": [
                "Engineered a robust encryption layer for sensitive data storage using AES-256.",
                "Designed a relational schema capable of handling millions of cross-referenced criminal records efficiently.",
                "Reduced manual paperwork processing time for detectives by 80% through digitized case workflows."
            ]
        },
        {
            "name": "mangeshrautarchive",
            "tech": ["FastAPI", "Three.js", "Gemini 2.0 Flash", "Tailwind"],
            "description": "This premium AI-first portfolio showcasing agentic AI capabilities.",
            "technical_wins": [
                "Achieved ultra-fast streaming responses (~60 tok/sec) using FastAPI's StreamingResponse and Gemini 2.0.",
                "Implemented a custom Interactive 3D Background using Three.js for immersive UX.",
                "Engineered 'Agentic Actions' that allow the AI to actively navigate and control the UI."
            ]
        },
        {
            "name": "Starlight-Blogging-Website",
            "tech": ["Angular", "Flask", "SQLite", "Markdown"],
            "description": "A high-performance blogging platform with integrated developer tools.",
            "technical_wins": [
                "Implemented a real-time markdown renderer with syntax highlighting for 20+ programming languages.",
                "Optimized SEO metrics to achieve a 100/100 Lighthouse score on desktop.",
                "Developed a custom auth system with JWT and refresh token rotation for high security."
            ]
        }
    ]
}

SYSTEM_PROMPT = f"""You are Antigravity, the elite AI technical partner for Mangesh Raut's 2026 Portfolio.

🎯 MISSION:
Represent Mangesh Raut as a high-performance Software Engineer. You are not just a chatbot; you are a technical peer capable of explaining complex distributed systems, AI architectures, and engineering wins.

📊 KNOWLEDGE BASE (Mangesh's Core Data):
{json.dumps(PORTFOLIO_DATA, indent=2)}

⚖️ RULES & REGULATIONS:
1. **Persona**: You are 'Antigravity'. Your tone is premium, precise, and visionary. Avoid generic 'AI assistant' tropes.
2. **Technical Depth**: When asked about projects, focus on 'Technical Wins'. Explain the 'How' and 'Why' (e.g., why LSTM for energy forecasting, how Redis optimized the bug tracker).
3. **Accuracy**: Only state facts found in the PORTFOLIO DATA. If asked about something else, provide general expert knowledge but clarify it's not specific to Mangesh's history.
4. **Formatting**: Use clean Markdown. Use bolding for emphasis. Keep paragraphs short and impactful.
5. **iMessage Style**: Keep initial responses punchy. Offer to dive deeper into specific modules.

💡 RESPONSE STRATEGY:
- If asked about Mangesh, highlight his 5+ years of experience and specialization in Java/Python/AWS.
- If asked about the 'Debug Runner' game, explain it's a technical demonstration of canvas-based physics and performance optimization.
- Always maintain a "Google AI Portfolio Challenge 2026" winning standard.
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

async def stream_gemini_response(model_id: str, messages: List[Dict], session_id: Optional[str] = None) -> AsyncGenerator[str, None]:
    """Streaming from Google Gemini AI"""
    print(f"🔄 Streaming from Google Gemini: {model_id}")
    
    if not GOOGLE_API_KEY:
        yield json.dumps({"error": "Google API key not configured", "type": "error"}) + "\n"
        return
    
    # Send typing indicator start
    yield json.dumps({"type": "typing", "status": "start"}) + "\n"
    await asyncio.sleep(0.1)
    
    try:
        # Extract model name (strip 'google/' prefix)
        model_name = model_id.split("/")[-1] if "/" in model_id else model_id
        model = genai.GenerativeModel(model_name)
        
        # Convert messages to Gemini format
        gemini_history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})
        
        chat = model.start_chat(history=gemini_history)
        
        # Stop typing indicator
        yield json.dumps({"type": "typing", "status": "stop"}) + "\n"
        
        full_content = ""
        chunk_count = 0
        start_time = time.time()
        
        # Stream response
        response = chat.send_message(messages[-1]["content"], stream=True)
        
        for chunk in response:
            if chunk.text:
                content = chunk.text
                full_content += content
                chunk_count += 1
                yield json.dumps({
                    "type": "chunk",
                    "content": content,
                    "chunk_id": chunk_count
                }) + "\n"
        
        # Calculate final metrics
        elapsed = time.time() - start_time
        tokens_estimate = len(full_content) // 4
        tokens_per_sec = tokens_estimate / elapsed if elapsed > 0 else 0
        
        yield json.dumps({
            "type": "done",
            "full_content": full_content,
            "metadata": {
                "model": model_id,
                "source": "Google AI",
                "sourceLabel": f"Google Gemini ({model_name})",
                "category": "AI Response",
                "char_count": len(full_content),
                "tokens_estimate": tokens_estimate,
                "elapsed_ms": int(elapsed * 1000),
                "tokens_per_sec": round(tokens_per_sec, 2),
                "chunks": chunk_count
            }
        }) + "\n"
        
    except Exception as e:
        print(f"❌ Gemini error: {str(e)}")
        yield json.dumps({
            "error": f"Gemini error: {str(e)}",
            "type": "error"
        }) + "\n"


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
    
    if not (OPENROUTER_API_KEY or GOOGLE_API_KEY):
        print("❌ No API keys found")
        raise HTTPException(status_code=500, detail="AI service not configured. Please add API keys.")
    
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
                
                # Determine provider
                if selected_model.startswith("google/"):
                    generator = stream_gemini_response(selected_model, conversation, session_id)
                else:
                    generator = stream_openrouter_response(selected_model, conversation, session_id)
                
                async for chunk in generator:
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
            "api_key_configured": bool(OPENROUTER_API_KEY or GOOGLE_API_KEY),
            "google_ai_active": bool(GOOGLE_API_KEY),
            "openrouter_active": bool(OPENROUTER_API_KEY),
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

# Serve static files with robust path detection
try:
    # Get the directory where index.py is located (api folder)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_dir = os.path.join(base_dir, "src")
    
    if os.path.exists(src_dir):
        print(f"📁 Mounting static files from: {src_dir}")
        app.mount("/", StaticFiles(directory=src_dir, html=True), name="static")
    else:
        # Fallback for local development if run from root
        if os.path.exists("src"):
            print("📁 Mounting static files from: src (local fallback)")
            app.mount("/", StaticFiles(directory="src", html=True), name="static")
except Exception as e:
    print(f"⚠️ Static files mounting failed: {e}")
