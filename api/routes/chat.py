import json
import time
import asyncio
from datetime import datetime
from typing import List, Dict, AsyncGenerator, Optional
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

import httpx

from api.config import (
    ChatRequest,
    TypingIndicator,
    get_client_ip,
    check_rate_limit,
    api_error,
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    is_prompt_injection,
    sanitize_chat_text,
    sanitize_session_id,
    sanitize_client_history,
    get_session_memory,
    SYSTEM_PROMPT,
    SECURITY_SYSTEM_PROMPT,
    sanitize_context,
    build_context_prompt,
    DEFAULT_MODEL,
    MODELS,
    update_session_memory,
    is_resume_query,
    PORTFOLIO_DATA,
    API_URL,
    SITE_URL,
    SITE_TITLE,
    adaptive_llm_params,
    RATE_LIMIT_WINDOW,
)

router = APIRouter()


def generate_local_response(query: str) -> Dict:
    """Generate a meaningful response based on portfolio data without using an LLM."""
    query = query.lower().strip()

    # Greetings
    if any(g in query for g in ["hello", "hi", "hey", "greetings"]):
        return {
            "answer": "👋 Hello! I'm AssistMe, running in **Local Mode** (incorporating May 2026 updates like WebNN/Gemma 3). I can tell you about Mangesh's experience, skills, projects, and more. What would you like to know?",
            "category": "Greeting",
        }

    # Who is Mangesh
    if "who" in query and ("mangesh" in query or "you" in query):
        name = PORTFOLIO_DATA["name"]
        title = PORTFOLIO_DATA["title"]
        location = PORTFOLIO_DATA["location"]
        return {
            "answer": f"👨‍💻 **{name}** is a {title} based in {location}. He specializes in full-stack architecture, cloud pipelines, and AI systems. His portfolio incorporates a Hybrid AI Web Stack utilizing client-side **WebNN + Gemma 3** for low-latency edge interactions and server-side OpenRouter API orchestration.",
            "category": "About",
        }

    # Resume/CV
    if "resume" in query or "cv" in query:
        resume_url = PORTFOLIO_DATA["resume_url"]
        return {
            "answer": f"📄 You can download Mangesh's resume here: {resume_url}",
            "category": "Resume",
        }

    # Skills
    if "skill" in query or "stack" in query or "tech" in query or "language" in query:
        langs = ", ".join(PORTFOLIO_DATA["skills"]["languages"])
        frameworks = ", ".join(PORTFOLIO_DATA["skills"]["frameworks"][:4])
        return {
            "answer": f"🛠️ **Technical Stack**:\n• **Languages**: {langs}\n• **Frameworks**: {frameworks}, FastAPI\n• **Cloud**: AWS, Docker, Kubernetes\n• **AI/ML**: WebNN, Gemma 3, TensorFlow, scikit-learn\n• **Databases**: Cloud Firestore, PostgreSQL, MongoDB, Redis",
            "category": "Skills",
        }

    # Blogs
    if "blog" in query or "write" in query or "google i/o" in query or "open x" in query:
        return {
            "answer": "✍️ **Recent Technical Writing** (Apple-style Dev Newsletter):\n• **Google I/O 2026: The Rise of Agentic Web, Gemini 2.5, Gemma 3, and WebNN** (May 2026)\n• **Inside the Open X Algorithm** (May 2026)\n• **Decentralized AI Agents and WebGPU** (April 2026)\n\nYou can read all these blogs in the 'Technical Writings' section of the homepage!",
            "category": "Blogs",
        }

    # Projects
    if "project" in query:
        projects_list = "\n".join(
            [
                f"• **{p['name']}**: {p['achievements']}"
                for p in PORTFOLIO_DATA["projects"][:3]
            ]
        )
        return {
            "answer": f"🚀 **Key Projects**:\n{projects_list}\n• **Hybrid Edge/Cloud Portfolio**: Built this high-performance site featuring real-time Firestore analytics and WebNN integrations.",
            "category": "Projects",
        }

    # Contact
    if "contact" in query or "email" in query or "hiring" in query or "hire" in query:
        email = PORTFOLIO_DATA["email"]
        phone = PORTFOLIO_DATA["phone"]
        linkedin = PORTFOLIO_DATA["linkedin"]
        github = PORTFOLIO_DATA["github"]
        return {
            "answer": f"📫 **Contact Information**:\n• **Email**: {email}\n• **Phone**: {phone}\n• **LinkedIn**: {linkedin}\n• **GitHub**: {github}",
            "category": "Contact",
        }

    # Experience
    if "experience" in query or "job" in query or "work" in query:
        exp_list = "\n".join(
            [
                f"• **{e['title']}** at {e['company']} ({e['period']})"
                for e in PORTFOLIO_DATA["experience"][:3]
            ]
        )
        return {
            "answer": f"💼 **Professional Experience**:\n{exp_list}",
            "category": "Experience",
        }

    # Education
    if (
        "education" in query
        or "degree" in query
        or "university" in query
        or "college" in query
    ):
        edu_list = "\n".join(
            [
                f"• **{e['degree']}** - {e['school']} ({e['period']})"
                for e in PORTFOLIO_DATA.get("education", [])[:2]
            ]
        )
        return {
            "answer": f"🎓 **Education**:\n{edu_list}"
            if edu_list
            else "🎓 Mangesh holds a Master's in Computer Science from Drexel University (Graduated June 2025).",
            "category": "Education",
        }

    # Achievements
    if "achievement" in query or "award" in query or "accomplishment" in query:
        return {
            "answer": "🏆 **Key Achievements**:\n• Reduced dashboard latency by **40%** at Customized Energy Solutions\n• Built AI systems with **95% accuracy**\n• Published ML intrusion detection research paper in IEEE (2024)\n• Graduated MS CS from Drexel University with 3.76 GPA",
            "category": "Achievements",
        }

    # Default fallback
    return {
        "answer": "👋 I'm running in **Local Mode** (no cloud API key configured).\n\n**Available topics:**\n• Who is Mangesh?\n• Skills & Tech Stack\n• Recent Blogs (Google I/O 2026)\n• Projects\n• Experience\n• Education\n• Contact Info\n• Resume\n\nWhat would you like to know?",
        "category": "System",
    }


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


async def stream_openrouter_response(
    model: str, messages: List[Dict], session_id: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """Enhanced streaming with robust error handling and retries"""
    print(f"🔄 Streaming from OpenRouter: {model}")

    if not OPENROUTER_API_KEY:
        print("⚠️ No API Key found - activating Local Intelligence Fallback")

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
        await asyncio.sleep(0.6)
        yield json.dumps({"type": "typing", "status": "stop"}) + "\n"

        # Stream the fallback response
        full_text = fallback["answer"]
        chunk_size = 4
        current_pos = 0

        while current_pos < len(full_text):
            chunk = full_text[current_pos : current_pos + chunk_size]
            current_pos += chunk_size
            yield (
                json.dumps(
                    {
                        "type": "chunk",
                        "content": chunk,
                        "chunk_id": current_pos // chunk_size,
                    }
                )
                + "\n"
            )
            await asyncio.sleep(0.02)

        # Send done signal
        yield (
            json.dumps(
                {
                    "type": "done",
                    "full_content": full_text,
                    "metadata": {
                        "model": "Local-FastAPI",
                        "source": "Local Intelligence",
                        "sourceLabel": "Local Dev Mode",
                        "category": fallback.get("category", "General"),
                        "confidence": 1.0,
                        "tokens_estimate": len(full_text) // 4,
                        "elapsed_ms": 600,
                    },
                }
            )
            + "\n"
        )
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
            full_content = ""
            chunk_count = 0

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0)
            ) as client:
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
                            next(
                                (
                                    m["content"]
                                    for m in reversed(messages)
                                    if m.get("role") == "user"
                                ),
                                "",
                            )
                        ),
                    },
                ) as response:
                    if response.status_code != 200:
                        await response.aread()
                        print(f"❌ OpenRouter API error: status={response.status_code}")
                        yield (
                            json.dumps(
                                {
                                    "error": "AI service is temporarily unavailable. Please try again in a moment.",
                                    "type": "error",
                                }
                            )
                            + "\n"
                        )
                        return

                    if retry_count == 0:
                        yield json.dumps({"type": "typing", "status": "stop"}) + "\n"

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue

                        data = line[6:]
                        if data == "[DONE]":
                            elapsed = time.time() - start_time
                            tokens_estimate = len(full_content) // 4
                            tokens_per_sec = (
                                tokens_estimate / elapsed if elapsed > 0 else 0
                            )

                            yield (
                                json.dumps(
                                    {
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
                                            "chunks": chunk_count,
                                        },
                                    }
                                )
                                + "\n"
                            )
                            return

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
                                yield (
                                    json.dumps(
                                        {
                                            "type": "chunk",
                                            "content": content,
                                            "chunk_id": chunk_count,
                                        }
                                    )
                                    + "\n"
                                )
                        except BaseException:
                            continue

            retry_count += 1
            await asyncio.sleep(0.5)

        except (httpx.RemoteProtocolError, httpx.ReadError, httpx.ReadTimeout) as e:
            print(f"⚠️ Stream connection error: {type(e).__name__}")
            retry_count += 1
            if retry_count > max_retries:
                yield (
                    json.dumps(
                        {
                            "error": "The neural link was interrupted. Please try rephrasing or refreshing.",
                            "type": "error",
                        }
                    )
                    + "\n"
                )
            else:
                await asyncio.sleep(1)
        except Exception as e:
            print(f"❌ Critical stream error: {type(e).__name__}")
            yield (
                json.dumps(
                    {
                        "error": "AI service failed before a complete response was produced.",
                        "type": "error",
                    }
                )
                + "\n"
            )
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
                **adaptive_llm_params(
                    next(
                        (
                            m["content"]
                            for m in reversed(messages)
                            if m.get("role") == "user"
                        ),
                        "",
                    )
                ),
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


@router.post("/chat")
@router.post("/api/chat")
async def chat_endpoint(request: ChatRequest, req: Request):
    """Enhanced chat endpoint with memory, rate limiting, and streaming"""
    start_time = time.time()
    client_ip = get_client_ip(req)
    message = sanitize_chat_text(request.message)

    # Rate limiting
    if not check_rate_limit(client_ip):
        raise api_error(
            code="RATE_LIMITED",
            message="You've sent too many requests. Please wait a moment before trying again.",
            status=429,
            retry_after=RATE_LIMIT_WINDOW,
        )
    print(f"📨 Chat request from {client_ip}: chars={len(message)}")

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if not OPENROUTER_API_KEY:
        print("⚠️ No API key - using Local Intelligence fallback")
        fallback = generate_local_response(message)
        elapsed = time.time() - start_time
        return {
            "answer": fallback["answer"],
            "source": "Local Intelligence",
            "model": "Local-FastAPI",
            "category": fallback.get("category", "General"),
            "confidence": 1.0,
            "runtime": f"{int(elapsed * 1000)}ms",
            "type": "local",
        }

    try:
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

        session_id = sanitize_session_id(request.session_id)

        # Check for direct commands
        direct_response = await handle_direct_command(message)
        if direct_response:
            return direct_response

        # Get conversation history
        if request.messages:
            history = sanitize_client_history(request.messages)
        else:
            history = get_session_memory(session_id) if request.session_id else []

        # Build conversation with context
        system_message = {
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\n{SECURITY_SYSTEM_PROMPT}",
        }

        # Add context awareness
        safe_context = sanitize_context(request.context)
        if safe_context:
            context_prompt = build_context_prompt(message, safe_context)
            user_message = {"role": "user", "content": context_prompt}
        else:
            user_message = {"role": "user", "content": message}

        conversation = [system_message] + history + [user_message]

        # Select model
        selected_model = request.model or DEFAULT_MODEL
        if selected_model not in [m["id"] for m in MODELS]:
            selected_model = DEFAULT_MODEL

        # Streaming response
        if request.stream:

            async def generate_stream():
                full_response = ""
                async for chunk in stream_openrouter_response(
                    selected_model, conversation, session_id
                ):
                    yield chunk
                    try:
                        data = json.loads(chunk)
                        if data.get("type") == "done":
                            full_response = data.get("full_content", "")
                    except BaseException:
                        pass

                if full_response and session_id:
                    update_session_memory(session_id, message, full_response)

            return StreamingResponse(
                generate_stream(),
                media_type="application/x-ndjson",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                    "X-Session-ID": session_id,
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

        if session_id:
            update_session_memory(session_id, message, response["answer"])

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Chat endpoint error: {type(e).__name__}")
        return {
            "error": "Internal server error",
            "answer": "⚠️ Something went wrong. Please try again.",
            "source": "Error",
            "model": "None",
        }


@router.get("/api/models")
async def get_models():
    """Get available AI models"""
    return {
        "models": MODELS,
        "default": DEFAULT_MODEL,
        "current": OPENROUTER_MODEL or DEFAULT_MODEL,
    }


@router.post("/api/typing")
async def typing_indicator(indicator: TypingIndicator):
    """Handle typing indicators (for future WebSocket support)"""
    return {
        "status": "received",
        "session_id": indicator.session_id,
        "is_typing": indicator.is_typing,
    }


@router.get("/api/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Get conversation history for a session"""
    history = get_session_memory(session_id)
    return {"session_id": session_id, "messages": history, "count": len(history)}


@router.delete("/api/conversation/{session_id}")
async def clear_conversation(session_id: str):
    """Clear conversation history"""
    from api.config import conversation_memory
    if session_id in conversation_memory:
        del conversation_memory[session_id]
    return {"status": "cleared", "session_id": session_id}
