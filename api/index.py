import os
import json
import time
import random
import httpx
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
from datetime import datetime
import asyncio

# Initialize FastAPI
app = FastAPI()

# CORS Configuration
origins = [
    "https://mangeshraut712.github.io",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
API_URL = "https://openrouter.ai/api/v1/chat/completions"
SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://mangeshraut712.github.io/mangeshrautarchive/")
SITE_TITLE = os.getenv("OPENROUTER_SITE_TITLE", "Mangesh Raut Portfolio")

# Models
MODELS = [
    {"id": "google/gemini-2.0-flash-exp:free", "name": "Gemini 2.0 Flash (Free)", "priority": 1},
    {"id": "google/gemini-2.0-flash-001", "name": "Gemini 2.0 Flash", "priority": 2},
    {"id": "google/gemini-2.0-pro-exp-02-05:free", "name": "Gemini 2.0 Pro", "priority": 3}
]
DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free"

# Portfolio Data
PORTFOLIO_SUMMARY = {
    "name": "Mangesh Raut",
    "title": "Software Engineer | Full-Stack Developer | AI/ML Engineer",
    "location": "Philadelphia, PA",
    "email": "mbr63drexel@gmail.com",
    "phone": "+1 (609) 505 3500",
    "linkedin": "in/mangeshraut71298",
    "github": "mangeshraut712",
    "summary": "Software Engineer with expertise in Java Spring Boot, Python, AngularJS, AWS, and machine learning. Currently optimizing energy analytics at Customized Energy Solutions with 40% efficiency gains. Previously improved network latency by 35% and codebase performance by 20% at IoasiZ.",
    "experience": {
        "current": {
            "title": "Software Engineer",
            "company": "Customized Energy Solutions",
            "period": "Aug 2024 - Present",
            "achievements": ["Reduced dashboard latency by 40%", "Accelerated deployments by 35%", "Improved ML model accuracy by 25%"]
        },
        "previous": {
            "title": "Software Engineer",
            "company": "IoasiZ",
            "period": "Jul 2023 - Jul 2024",
            "achievements": ["Refactored legacy systems with 20% reduction in code", "Resolved 50+ microservices bugs", "Integrated Redis caching"]
        }
    },
    "skills": {
        "languages": ["Java", "Python", "SQL", "JavaScript"],
        "frameworks": ["Spring Boot", "AngularJS", "TensorFlow", "scikit-learn"],
        "cloud": ["AWS", "Docker", "Jenkins", "Terraform"],
        "databases": ["PostgreSQL", "MongoDB", "MySQL"],
        "tools": ["Git", "Jira", "Tableau", "Wireshark"]
    },
    "education": "Master of Science in Computer Science (Drexel University) - Currently pursuing | Bachelor of Engineering in Computer Engineering (Pune University) - GPA 3.6",
    "projects": {
        "portfolio": {
            "name": "Starlight Blogging Website",
            "tech": ["Angular", "Flask", "SQLite"],
            "achievements": "100+ users, authentication, content management"
        },
        "ml": {
            "name": "Face Emotion Recognition",
            "tech": ["Python", "OpenCV", "ML"],
            "achievements": "95% accuracy, real-time processing"
        },
        "security": {
            "name": "PC Crime Detector",
            "tech": ["Java", "Database", "Automation"],
            "achievements": "80% breach reduction"
        }
    }
}

SYSTEM_PROMPT = """You are AssistMe, an intelligent AI assistant powered by OpenRouter using advanced models like Google's Gemini 2.0 Flash, Llama 3.3, and DeepSeek.

Your Core Instructions:
1. **Portfolio Expert**: You have full access to Mangesh Raut's professional background (provided below). Answer questions about his experience, skills, and projects with high accuracy.
2. **General Knowledge**: You are a capable AI assistant. You CAN answer general questions about the world, technology, science, history, and current events (up to your knowledge cutoff).
   - Example: If asked "Who is the CEO of Meta?", answer "Mark Zuckerberg".
   - Example: If asked "Explain quantum computing", provide a clear explanation.
3. **Coding Assistant**: You can write, debug, and explain code in various languages (Python, Java, JavaScript, etc.).

Guidelines:
- Be professional, concise, and friendly.
- If a question is about Mangesh, prioritize the provided LinkedIn/Portfolio data.
- If a question is NOT about Mangesh, answer it directly using your general knowledge.
- Do NOT say "I don't have access to real-time info" for static facts (like CEOs of major companies).
- Keep responses under 200 words unless detailed explanation is requested.

CRITICAL EDUCATION INFO:
- Mangesh's HIGHEST COMPLETED qualification is: Bachelor of Engineering in Computer Engineering (2014-2017, graduated 2017)
- He is CURRENTLY PURSUING: Master of Science in Computer Science at Drexel University (2023-2025, expected 2025)
- When asked about "highest qualification", say: "Bachelor's degree in Computer Engineering (completed 2017). He is currently pursuing a Master's at Drexel University."
"""

# Cache
response_cache = {}
CACHE_DURATION = 300  # 5 minutes

# Request Models
class ChatRequest(BaseModel):
    message: str
    messages: Optional[List[Dict[str, str]]] = []
    context: Optional[Dict[str, Any]] = {}
    stream: bool = False

# Helper Functions
def get_cache_key(message: str, type_: str) -> str:
    return f"{type_}:{message.strip().lower()}"

def get_cached_response(cache_key: str):
    cached = response_cache.get(cache_key)
    if not cached:
        return None
    
    if time.time() - cached["timestamp"] > CACHE_DURATION:
        del response_cache[cache_key]
        return None
    
    print(f"🚀 Using cached response for: {cache_key}")
    return cached["response"]

def set_cached_response(cache_key: str, response: Dict):
    if not response.get("answer") or len(response["answer"]) < 10:
        return
    
    response_cache[cache_key] = {
        "response": {**response, "cached": True},
        "timestamp": time.time()
    }
    
    # Cleanup
    if len(response_cache) > 50:
        sorted_keys = sorted(response_cache.keys(), key=lambda k: response_cache[k]["timestamp"], reverse=True)
        for k in sorted_keys[30:]:
            del response_cache[k]

def is_linkedin_query(message: str) -> bool:
    keywords = [
        'experience', 'work', 'job', 'career', 'skills', 'education',
        'university', 'degree', 'project', 'portfolio', 'background',
        'about you', 'tell me about', 'who are you', 'mangesh', 'resume'
    ]
    lower = message.lower()
    return any(keyword in lower for keyword in keywords)

def build_context_prompt(message: str, context: Dict = {}) -> str:
    prompt = f"User Question: {message}\n\n"
    
    if context.get("currentSection"):
        prompt += f"[User is currently viewing the \"{context['currentSection']}\" section]\n"
    
    if context.get("visibleProjects"):
        titles = ", ".join([p["title"] for p in context["visibleProjects"]])
        prompt += f"[Projects currently visible on screen: {titles}]\n"
    
    if context.get("latestBlog"):
        prompt += f"[Latest Blog Post: \"{context['latestBlog']['title']}\"]\n"
    
    prompt += f"\nPortfolio Summary:\n{json.dumps(PORTFOLIO_SUMMARY, indent=2)}\n"
    prompt += "\nPlease answer the user's question using the provided information. If the user refers to \"this\" or \"visible\" items, use the screen context. Be professional and concise."
    
    return prompt

def classify_type(message: str) -> str:
    lower = message.lower()
    if any(x in lower for x in ['calculate', 'math', 'sum', 'multiply']) or any(c in message for c in ['+', '-', '*', '/']):
        return 'math'
    if is_linkedin_query(message):
        return 'portfolio'
    if any(x in lower for x in ['code', 'programming', 'function', 'algorithm']):
        return 'coding'
    return 'general'

def get_category(type_: str) -> str:
    return {
        'math': 'Mathematics',
        'portfolio': 'Portfolio',
        'coding': 'Programming',
        'general': 'General Knowledge'
    }.get(type_, 'General')

async def handle_direct_command(message: str) -> Optional[Dict]:
    lower = message.lower()
    now = datetime.now()
    
    # Time
    if 'time' in lower and 'timezone' not in lower:
        return {
            "answer": f"⏰ Current time is {now.strftime('%I:%M %p')}",
            "source": "Direct Command",
            "model": "Built-in",
            "category": "Time & Date",
            "confidence": 1.0,
            "runtime": "0ms",
            "type": "time",
            "processingTime": 0,
            "providers": ["Built-in"]
        }
    
    # Date
    if 'date' in lower or 'today' in lower:
        return {
            "answer": f"📅 Today is {now.strftime('%A, %B %d, %Y')}",
            "source": "Direct Command",
            "model": "Built-in",
            "category": "Time & Date",
            "confidence": 1.0,
            "runtime": "0ms",
            "type": "time",
            "processingTime": 0,
            "providers": ["Built-in"]
        }
    
    return None

async def call_openrouter_stream(model: str, messages: List[Dict]):
    print(f"🔄 Streaming request to OpenRouter with model: {model}")
    if not OPENROUTER_API_KEY:
        print("❌ OpenRouter API key is MISSING in call_openrouter_stream")
        yield json.dumps({"error": "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in Vercel environment variables."}) + "\n"
        return

    async with httpx.AsyncClient() as client:
        try:
            async with client.stream(
                "POST",
                API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_TITLE
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "stream": True
                },
                timeout=30.0
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"❌ OpenRouter API Error {response.status_code}: {error_text.decode()}")
                    yield json.dumps({"error": f"OpenRouter Error {response.status_code}: {error_text.decode()}"}) + "\n"
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            json_data = json.loads(data)
                            content = json_data["choices"][0]["delta"].get("content", "")
                            if content:
                                yield json.dumps({"chunk": content}) + "\n"
                        except:
                            continue
        except Exception as e:
            print(f"❌ Stream Exception: {str(e)}")
            yield json.dumps({"error": str(e)}) + "\n"

async def call_openrouter(model: str, messages: List[Dict]) -> Dict:
    if not OPENROUTER_API_KEY:
        raise Exception("OpenRouter API key not configured")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_TITLE
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get("choices"):
                raise Exception("Invalid response format")
                
            return {
                "answer": data["choices"][0]["message"]["content"].strip(),
                "usage": data.get("usage"),
                "model": model
            }
        except Exception as e:
            print(f"❌ Error with model {model}: {str(e)}")
            raise e

# API Routes
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    start_time = time.time()
    print(f"📨 Received chat request: {request.message[:50]}...")
    
    # Log Key Status and short-circuit if missing
    if not OPENROUTER_API_KEY:
        print("❌ API Key MISSING in chat_endpoint")
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API key not configured on the server."
        )
    else:
        print(f"🔑 API Key present (starts with {OPENROUTER_API_KEY[:4]}...)")

    try:
        message = request.message.strip()
        if not message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        # Direct Commands
        direct_response = await handle_direct_command(message)
        if direct_response:
            return direct_response
            
        # Classification
        type_ = classify_type(message)
        category = get_category(type_)
        wants_linkedin = is_linkedin_query(message)
        
        # Cache Check (Only for non-streaming)
        if not request.stream:
            cache_key = get_cache_key(message, type_)
            cached = get_cached_response(cache_key)
            if cached:
                cached["cached"] = True
                return cached
            
        # Joke Command
        if 'joke' in message.lower() or 'funny' in message.lower():
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get('https://official-joke-api.appspot.com/random_joke')
                    data = resp.json()
                    result = {
                        "answer": f"😄 {data['setup']}\n\n{data['punchline']}",
                        "source": "Joke API",
                        "model": "Entertainment",
                        "category": "Entertainment",
                        "confidence": 1.0,
                        "runtime": f"{int((time.time() - start_time) * 1000)}ms",
                        "type": "entertainment",
                        "processingTime": int((time.time() - start_time) * 1000),
                        "providers": ["Joke API"]
                    }
                    # set_cached_response(cache_key, result) # cache_key might be undefined if stream=True
                    return result
            except:
                pass

        # Build Messages
        system_message = {"role": "system", "content": SYSTEM_PROMPT}
        if wants_linkedin or request.context:
            user_content = build_context_prompt(message, request.context)
            user_message = {"role": "user", "content": user_content}
        else:
            user_message = {"role": "user", "content": message}
            
        conversation = [system_message] + (request.messages or []) + [user_message]
        
        # Streaming Response
        if request.stream:
            return StreamingResponse(
                call_openrouter_stream(DEFAULT_MODEL, conversation),
                media_type="application/x-ndjson"
            )
        
        # Standard Response (Fallback or explicit non-stream)
        # Try models in sequence
        last_error = None
        for model_info in MODELS:
            try:
                print(f"🔄 Trying model: {model_info['id']}")
                response = await call_openrouter(model_info['id'], conversation)
                
                runtime = int((time.time() - start_time) * 1000)
                result = {
                    "answer": response["answer"],
                    "source": "OpenRouter",
                    "model": response["model"],
                    "category": "Portfolio" if wants_linkedin else category,
                    "confidence": 0.95 if wants_linkedin else 0.90,
                    "runtime": f"{runtime}ms",
                    "type": type_,
                    "processingTime": runtime,
                    "providers": ["OpenRouter"],
                    "usage": response["usage"]
                }
                
                # set_cached_response(cache_key, result)
                return result
                
            except Exception as e:
                last_error = e
                continue
        
        raise last_error or Exception("All models failed")

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        is_config_error = "key not configured" in str(e).lower()
        
        return {
            "error": "Configuration error" if is_config_error else "Internal server error",
            "message": str(e),
            "answer": "⚠️ OpenRouter API key missing." if is_config_error else "⚠️ Something went wrong. Please try again.",
            "source": "Error",
            "model": "None",
            "category": "Error",
            "confidence": 0,
            "runtime": "0ms"
        }

@app.get("/api/health")
async def health_check():
    """Comprehensive health check for the API."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "portfolio-chatbot-api",
        "version": "1.0.0",
        "configuration": {
            "openrouter_configured": bool(OPENROUTER_API_KEY),
            "models_available": len(MODELS),
            "default_model": DEFAULT_MODEL
        },
        "environment": os.getenv("VERCEL_ENV", "development")
    }

@app.get("/health")
async def health_redirect():
    """Redirect or alias for /api/health."""
    return await health_check()

@app.get("/status")
async def status_endpoint():
    """Vercel-compatible status endpoint."""
    return await health_check()

# Serve Static Files (Frontend) for Local Development
if os.getenv("VERCEL_ENV") != "production":
    try:
        app.mount("/assets", StaticFiles(directory="src/assets"), name="assets")
        app.mount("/js", StaticFiles(directory="src/js"), name="js")
        
        @app.get("/")
        async def read_root():
            return FileResponse("src/index.html")
    except Exception as e:
        print(f"⚠️ Static file mounting skipped (likely on Vercel): {e}")

# Root endpoint for API
@app.get("/api")
async def api_root():
    return {
        "message": "Welcome to Mangesh Raut's Portfolio API",
        "endpoints": [
            "/api/chat",
            "/api/health"
        ],
        "documentation": "/docs"
    }
