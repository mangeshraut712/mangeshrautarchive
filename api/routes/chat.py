import json
import time
import asyncio
import re
from datetime import datetime
from typing import List, Dict, AsyncGenerator, Optional
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

import httpx
import logging

logger = logging.getLogger(__name__)

from api.config import (
    ChatRequest,
    TypingIndicator,
    get_client_ip,
    check_rate_limit,
    api_error,
    get_openrouter_api_key,
    get_default_model,
    get_site_url,
    get_site_title,
    FALLBACK_OPENROUTER_MODEL,
    PRIMARY_OPENROUTER_MODEL,
    FUSION_MODEL,
    is_prompt_injection,
    sanitize_chat_text,
    sanitize_session_id,
    create_session_token,
    verify_session_token,
    sanitize_client_history,
    get_session_memory,
    SYSTEM_PROMPT,
    SECURITY_SYSTEM_PROMPT,
    sanitize_context,
    build_context_prompt,
    MODELS,
    update_session_memory,
    is_resume_query,
    PORTFOLIO_DATA,
    API_URL,
    adaptive_llm_params,
    RATE_LIMIT_WINDOW,
)
from api.monitoring import system_monitor, EventType
from api.model_router import (
    AUTO_ROUTER_ALLOWED,
    AUTO_ROUTER_MODEL,
    build_model_fallback_chain,
    resolve_chat_model,
)
from api.site_knowledge import (
    build_site_knowledge_prompt,
    format_blog_release_summary,
    format_usa_state_summary,
    retrieve_site_context,
    should_use_web_tools,
)

router = APIRouter()


def _query_has_word(query: str, word: str) -> bool:
    return re.search(rf"\b{re.escape(word)}\b", query) is not None


def _query_has_any_word(query: str, words: List[str]) -> bool:
    return any(_query_has_word(query, word) for word in words)


def is_usa_state_travel_query(query: str) -> bool:
    """Detect direct USA travel-count questions that should use site data."""
    usa_terms = ["usa", "u.s.", "u.s.a", "united states", "america"]
    travel_terms = ["visited", "visit", "travel", "travelled", "traveled", "been", "covered"]
    return (
        any(term in query for term in usa_terms)
        and "state" in query
        and any(term in query for term in travel_terms)
    )


def is_blog_release_query(query: str) -> bool:
    """Detect direct blog release questions that should use the local index."""
    return "blog" in query and any(
        term in query
        for term in ["this month", "released", "release", "new", "latest", "june 2026"]
    )


def openrouter_request_body(
    model: str,
    messages: List[Dict],
    *,
    stream: bool = False,
    web_tools_enabled: bool = False,
    session_id: Optional[str] = None,
) -> Dict:
    """Build a bounded OpenRouter request body with optional 2026 web tools."""
    user_message = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user"),
        "",
    )
    body = {
        "model": model,
        "messages": messages,
        "stream": stream,
        **adaptive_llm_params(user_message),
    }
    if not stream:
        body.pop("stream", None)

    if model == AUTO_ROUTER_MODEL:
        body["plugins"] = [
            {
                "id": "auto-router",
                "cost_quality_tradeoff": 2,
                "allowed_models": AUTO_ROUTER_ALLOWED,
            }
        ]
        if session_id:
            body["session_id"] = session_id

    if web_tools_enabled:
        body["tools"] = [
            {
                "type": "openrouter:web_search",
                "parameters": {
                    "engine": "parallel",
                    "max_results": 5,
                    "max_total_results": 10,
                    "search_context_size": "medium",
                },
            },
            {
                "type": "openrouter:web_fetch",
                "parameters": {
                    "engine": "openrouter",
                    "max_content_tokens": 12000,
                    "blocked_domains": [
                        "localhost",
                        "127.0.0.1",
                        "0.0.0.0",
                        "[::1]",
                        "169.254.169.254",
                        "metadata.google.internal",
                    ],
                },
            },
        ]

    return body


def generate_local_response(query: str, site_context: str = "") -> Dict:
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
    if _query_has_any_word(query, ["skill", "stack", "tech"]) or _query_has_word(query, "language"):
        langs = ", ".join(PORTFOLIO_DATA["skills"]["languages"])
        frameworks = ", ".join(PORTFOLIO_DATA["skills"]["frameworks"][:4])
        return {
            "answer": f"🛠️ **Technical Stack**:\n• **Languages**: {langs}\n• **Frameworks**: {frameworks}, FastAPI\n• **Cloud**: AWS, Docker, Kubernetes\n• **AI/ML**: WebNN, Gemma 3, TensorFlow, scikit-learn\n• **Databases**: Cloud Firestore, PostgreSQL, MongoDB, Redis",
            "category": "Skills",
        }

    if is_blog_release_query(query):
        return {
            "answer": f"📝 **Blog Releases**\n\n{format_blog_release_summary(query)}",
            "category": "Blogs",
        }

    # Blogs
    if _query_has_word(query, "blog") or _query_has_any_word(query, ["write", "google i/o", "open x"]):
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
    if _query_has_any_word(query, ["experience", "job", "work"]):
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

    # Astrology (public high-level only — no private PII)
    if any(k in query for k in ["horoscope", "astrology", "birth chart", "vedic"]):
        return {
            "answer": (
                "✨ **Public personality notes**:\n"
                "Mangesh shares a high-level interest in Vedic symbolism as cultural context. "
                "Publicly he is described as **balanced, diplomatic, and analytically driven** — "
                "aligned with a software-engineering career focused on systems thinking and clear communication.\n\n"
                "For professional details (role, stack, projects, education), ask about experience or skills. "
                "Private chart / family / medical details are not part of this portfolio assistant."
            ),
            "category": "Astrology",
        }

    # Foreign Settlement & USA Career Context
    if any(k in query for k in ["foreign", "settlement", "abroad", "settle", "relocation", "visa", "h1b", "relocate", "usa career"]):
        return {
            "answer": (
                "🌍 **USA career context (public)**:\n"
                "Mangesh completed his **MSCS in the United States** and worked as a full-time **Software Development Engineer** "
                "at Customized Energy Solutions. He continues global engineering work with interest in US tech opportunities "
                "across the **Northeast corridor** and **West Coast** tech hubs.\n\n"
                "Ask about experience, skills, or projects for hiring-oriented detail."
            ),
            "category": "Career",
        }

    # Personality Traits
    if any(k in query for k in ["personality", "trait", "character"]):
        return {
            "answer": (
                "🧠 **Working style**:\n"
                "Colleagues and portfolio evidence emphasize **systems thinking**, resilience under delivery pressure, "
                "and a pragmatic full-stack / AI engineering approach. He values clear communication and shipping production-quality software."
            ),
            "category": "About",
        }

    # Family — public assistant does not disclose private family details
    if any(k in query for k in ["family", "parents", "mother", "father", "sister", "vidya", "meena", "bharat"]):
        return {
            "answer": (
                "👨‍👩‍👧 **Family**:\n"
                "AssistMe keeps family details private. For professional background, ask about "
                "**experience**, **education**, **projects**, or **skills**."
            ),
            "category": "Family",
        }

    # Personal identity — no medical / home address disclosure
    if any(
        k in query
        for k in [
            "hinoji",
            "birth name",
            "call name",
            "navaras",
            "height",
            "complexion",
            "blood group",
            "address",
            "residence",
            "hometown",
        ]
    ):
        return {
            "answer": (
                "👤 **Public identity**:\n"
                "• **Name**: Mangesh Bharat Raut\n"
                "• **Languages**: English (professional), Marathi (native), Hindi\n"
                "• **Professional locations**: CES (US / India hybrid engineering context)\n\n"
                "Home address, medical data, and private cultural records are **not** shared by this assistant."
            ),
            "category": "Identity",
        }

    if is_usa_state_travel_query(query):
        return {
            "answer": f"🇺🇸 **USA Travel Coverage**\n\n{format_usa_state_summary()}",
            "category": "Travel",
        }

    if site_context and _query_has_any_word(
        query,
        [
            "travel",
            "atlas",
            "city",
            "cities",
            "monitor",
            "system",
            "api",
            "backend",
            "blog",
            "website",
            "page",
        ],
    ):
        excerpt = site_context[:1800].rsplit(" ", 1)[0]
        return {
            "answer": (
                "I found this in the public portfolio knowledge base:\n\n"
                f"{excerpt}\n\n"
                "Cloud AI is not configured in this environment, so this is a direct site-knowledge answer rather than a synthesized model response."
            ),
            "category": "Site Knowledge",
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

    if is_usa_state_travel_query(lower):
        return {
            "answer": f"🇺🇸 **USA Travel Coverage**\n\n{format_usa_state_summary()}",
            "source": "Site Knowledge",
            "model": "Travel Atlas Index",
            "category": "Travel",
            "confidence": 1.0,
            "runtime": "0ms",
            "type": "direct",
            "knowledge_context": True,
            "web_tools": False,
        }

    if is_blog_release_query(lower):
        return {
            "answer": f"📝 **Blog Releases**\n\n{format_blog_release_summary(lower)}",
            "source": "Site Knowledge",
            "model": "Blog Index",
            "category": "Blogs",
            "confidence": 1.0,
            "runtime": "0ms",
            "type": "direct",
            "knowledge_context": True,
            "web_tools": False,
        }

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


async def stream_static_chat_response(payload: Dict, start_time: float) -> AsyncGenerator[str, None]:
    """Stream deterministic/local answers through the same NDJSON contract as AI responses."""
    answer = payload.get("answer", "")
    chunk_size = 72
    chunk_count = 0

    yield json.dumps({"type": "typing", "status": "stop"}) + "\n"

    for current_pos in range(0, len(answer), chunk_size):
        chunk_count += 1
        yield (
            json.dumps(
                {
                    "type": "chunk",
                    "content": answer[current_pos : current_pos + chunk_size],
                    "chunk_id": chunk_count,
                }
            )
            + "\n"
        )
        await asyncio.sleep(0)

    elapsed_ms = int((time.time() - start_time) * 1000)
    yield (
        json.dumps(
            {
                "type": "done",
                "full_content": answer,
                "metadata": {
                    "model": payload.get("model", "Local-FastAPI"),
                    "source": payload.get("source", "Local Intelligence"),
                    "sourceLabel": payload.get("source", "Local Intelligence"),
                    "category": payload.get("category", "General"),
                    "confidence": payload.get("confidence", 1.0),
                    "knowledge_context": payload.get("knowledge_context", False),
                    "web_tools": payload.get("web_tools", False),
                    "char_count": len(answer),
                    "tokens_estimate": max(1, len(answer) // 4),
                    "elapsed_ms": elapsed_ms,
                    "chunks": chunk_count,
                },
            }
        )
        + "\n"
    )


def _upstream_fallback_answer(reason: str, site_context: str = "") -> Optional[str]:
    """User-facing copy when cloud AI is configured but temporarily unavailable."""
    lower = (reason or "").lower()
    if "402" in lower or "credit" in lower or "billing" in lower or "payment" in lower:
        return (
            "Cloud AI is temporarily unavailable because the OpenRouter account is out of "
            "credits (HTTP 402). Portfolio knowledge still works — try asking about skills, "
            "projects, experience, blogs, or travel. Add credits at "
            "https://openrouter.ai/settings/credits to restore full AssistMe answers."
        )
    if "429" in lower or "rate" in lower:
        return (
            "Cloud AI is rate-limited right now. Please wait a moment and try again, "
            "or ask a portfolio question (skills, projects, experience) for a local answer."
        )
    if any(token in lower for token in ("timeout", "connect", "network", "upstream", "openrouter")):
        return (
            "Cloud AI did not respond in time. You can retry in a few seconds, or ask about "
            "Mangesh's skills, projects, experience, blogs, or travel for a local portfolio answer."
        )
    if site_context and reason not in ("Local Intelligence", "no_key"):
        excerpt = site_context[:1800].rsplit(" ", 1)[0]
        return (
            "Cloud AI is temporarily unavailable, so here is a direct portfolio knowledge answer:\n\n"
            f"{excerpt}"
        )
    return None


def build_local_chat_payload(
    message: str,
    site_context: str,
    start_time: float,
    *,
    reason: str = "Local Intelligence",
) -> Dict:
    """Build the same local answer shape for offline and upstream-fallback modes."""
    fallback = generate_local_response(message, site_context)
    override = _upstream_fallback_answer(reason, site_context)
    # Prefer honest upstream failure copy over the misleading "no API key" blurb.
    answer = fallback["answer"]
    if override and reason not in ("Local Intelligence", "no_key"):
        lower_answer = answer.lower()
        if (
            fallback.get("category") == "System"
            or "no cloud API key" in lower_answer
            or "local mode" in lower_answer
        ):
            answer = override
    elapsed = int((time.time() - start_time) * 1000)
    return {
        "answer": answer,
        "source": reason,
        "model": "Local-FastAPI",
        "category": fallback.get("category", "General"),
        "confidence": 1.0,
        "runtime": f"{elapsed}ms",
        "type": "local",
        "knowledge_context": bool(site_context),
        "web_tools": False,
        "fallback_reason": reason,
    }


def _fallback_models(model: str) -> List[str]:
    return build_model_fallback_chain(model)


async def stream_openrouter_response(
    model: str,
    messages: List[Dict],
    session_id: Optional[str] = None,
    web_tools_enabled: bool = False,
    knowledge_context_enabled: bool = False,
    routing_tier: str = "auto",
) -> AsyncGenerator[str, None]:
    """Enhanced streaming with robust error handling and retries"""
    logger.info(
        f"Streaming from OpenRouter: {model} tier={routing_tier} "
        f"(site_context={knowledge_context_enabled}, web_tools={web_tools_enabled})"
    )
    user_msg = next(
        (m.get("content", "") for m in reversed(messages) if m.get("role") == "user"),
        "",
    )

    if not get_openrouter_api_key():
        logger.warning("⚠️ No API Key found - activating Local Intelligence Fallback")

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
    last_upstream_reason = "OpenRouter upstream unavailable"

    while retry_count <= max_retries:
        if retry_count > 0:
            logger.info(f"🔄 Retrying stream (attempt {retry_count}/{max_retries})...")
            full_content = ""
            chunk_count = 0

        for candidate_model in _fallback_models(model):
            try:
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(60.0, connect=10.0)
                ) as client:
                    async with client.stream(
                        "POST",
                        API_URL,
                        headers={
                            "Authorization": f"Bearer {get_openrouter_api_key()}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": get_site_url(),
                            "X-Title": get_site_title(),
                        },
                        json=openrouter_request_body(
                            candidate_model,
                            messages,
                            stream=True,
                            web_tools_enabled=web_tools_enabled,
                            session_id=session_id,
                        ),
                    ) as response:
                        if response.status_code != 200:
                            await response.aread()
                            last_upstream_reason = (
                                f"OpenRouter HTTP {response.status_code}"
                                + (
                                    " insufficient credits"
                                    if response.status_code == 402
                                    else ""
                                )
                            )
                            logger.error(
                                f"❌ OpenRouter API error for {candidate_model}: "
                                f"status={response.status_code}"
                            )
                            continue

                        model = candidate_model
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
                                                "sourceLabel": (
                                                    f"OpenRouter + Web ({model.split('/')[-1]})"
                                                    if web_tools_enabled
                                                    else f"OpenRouter ({model.split('/')[-1]})"
                                                ),
                                                "category": "AI Response",
                                                "knowledge_context": knowledge_context_enabled,
                                                "web_tools": web_tools_enabled,
                                                "web_engine": "parallel" if web_tools_enabled else None,
                                                "routing_tier": routing_tier,
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

                        return
            except (httpx.RemoteProtocolError, httpx.ReadError, httpx.ReadTimeout) as e:
                last_upstream_reason = f"OpenRouter timeout ({type(e).__name__})"
                logger.warning(f"⚠️ Stream connection error for {candidate_model}: {type(e).__name__}")
                continue
            except httpx.HTTPStatusError as e:
                last_upstream_reason = f"OpenRouter HTTP {e.response.status_code}"
                logger.error(f"❌ OpenRouter HTTP error for {candidate_model}: {e.response.status_code}")
                continue
            except httpx.RequestError as e:
                last_upstream_reason = f"OpenRouter network ({type(e).__name__})"
                logger.error(f"❌ Request error for {candidate_model}: {str(e)}")
                continue

        retry_count += 1
        await asyncio.sleep(0.5)

    fallback = build_local_chat_payload(
        user_msg,
        "",
        start_time,
        reason=last_upstream_reason,
    )
    async for item in stream_static_chat_response(fallback, start_time):
        yield item


async def call_openrouter(
    model: str,
    messages: List[Dict],
    web_tools_enabled: bool = False,
    session_id: Optional[str] = None,
) -> Dict:
    """Non-streaming API call with model fallback."""
    if not get_openrouter_api_key():
        raise Exception("API key not configured")

    last_error: Optional[Exception] = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        for candidate_model in _fallback_models(model):
            try:
                response = await client.post(
                    API_URL,
                    headers={
                        "Authorization": f"Bearer {get_openrouter_api_key()}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": get_site_url(),
                        "X-Title": get_site_title(),
                    },
                    json=openrouter_request_body(
                        candidate_model,
                        messages,
                        web_tools_enabled=web_tools_enabled,
                        session_id=session_id,
                    ),
                )
                response.raise_for_status()
                data = response.json()

                if not data.get("choices"):
                    raise Exception("Invalid response")

                return {
                    "answer": data["choices"][0]["message"]["content"].strip(),
                    "usage": data.get("usage"),
                    "model": data.get("model", candidate_model),
                }
            except Exception as exc:
                last_error = exc
                logger.error(f"❌ OpenRouter non-stream error for {candidate_model}: {exc}", exc_info=True)
                continue

    raise last_error or Exception("OpenRouter request failed")


@router.post("/chat")
@router.post("/api/chat")
async def chat_endpoint(request: ChatRequest, req: Request):
    """Enhanced chat endpoint with memory, rate limiting, and streaming"""
    start_time = time.time()
    client_ip = get_client_ip(req)
    message = sanitize_chat_text(request.message)

    # Rate limiting
    if not check_rate_limit(client_ip):
        if system_monitor is not None:
            system_monitor.log_event(
                f"Rate limit exceeded: {client_ip}",
                EventType.WARNING,
                {"client_ip": client_ip, "endpoint": "/api/chat"},
                "rate_limit",
            )
        raise api_error(
            code="RATE_LIMITED",
            message="You've sent too many requests. Please wait a moment before trying again.",
            status=429,
            retry_after=RATE_LIMIT_WINDOW,
        )
    logger.info(f"📨 Chat request from {client_ip}: chars={len(message)}")

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Prompt injection guard
    if is_prompt_injection(message):
        logger.warning(f"🛡️  Prompt injection detected from {client_ip}: chars={len(message)}")
        return {
            "answer": "I noticed your message contains instructions that try to change my behaviour. I'm here to help you learn about Mangesh's portfolio — feel free to ask me anything about that!",
            "source": "Security",
            "model": "Guard",
            "type": "blocked",
            "confidence": 1.0,
            "runtime": "0ms",
        }

    safe_context = sanitize_context(request.context)
    site_context = retrieve_site_context(message, safe_context)
    web_tools_enabled = should_use_web_tools(message, site_context)
    session_id = sanitize_session_id(request.session_id)

    direct_response = await handle_direct_command(message)
    if direct_response:
        direct_response["runtime"] = f"{int((time.time() - start_time) * 1000)}ms"
        if request.stream:
            return StreamingResponse(
                stream_static_chat_response(direct_response, start_time),
                media_type="application/x-ndjson",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                    "X-Session-ID": session_id,
                    "X-Session-Token": create_session_token(session_id) if session_id else "",
                },
            )
        return direct_response

    if not get_openrouter_api_key():
        logger.warning("⚠️ No API key - using Local Intelligence fallback")
        fallback = generate_local_response(message, site_context)
        elapsed = time.time() - start_time
        payload = {
            "answer": fallback["answer"],
            "source": "Local Intelligence",
            "model": "Local-FastAPI",
            "category": fallback.get("category", "General"),
            "confidence": 1.0,
            "runtime": f"{int(elapsed * 1000)}ms",
            "type": "local",
            "knowledge_context": bool(site_context),
            "web_tools": False,
        }
        if request.stream:
            return StreamingResponse(
                stream_static_chat_response(payload, start_time),
                media_type="application/x-ndjson",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                    "X-Session-ID": session_id,
                    "X-Session-Token": create_session_token(session_id) if session_id else "",
                },
            )
        return payload

    try:
        # Get conversation history
        if request.messages:
            history = sanitize_client_history(request.messages)
        else:
            history = get_session_memory(session_id) if request.session_id else []

        system_message = {
            "role": "system",
            "content": (
                f"{SYSTEM_PROMPT}\n\n{SECURITY_SYSTEM_PROMPT}\n\n"
                f"{build_site_knowledge_prompt(site_context, web_tools_enabled)}"
            ),
        }

        # Add context awareness
        if safe_context:
            context_prompt = build_context_prompt(message, safe_context)
            user_message = {"role": "user", "content": context_prompt}
        else:
            user_message = {"role": "user", "content": message}

        conversation = [system_message] + history + [user_message]

        selected_model, routed_web, routing_tier = resolve_chat_model(
            message,
            requested_model=request.model,
            site_context=site_context,
            stream=bool(request.stream),
        )
        if routed_web:
            web_tools_enabled = True

        # Streaming response
        if request.stream:

            async def generate_stream():
                full_response = ""
                async for chunk in stream_openrouter_response(
                    selected_model,
                    conversation,
                    session_id,
                    web_tools_enabled,
                    bool(site_context),
                    routing_tier,
                ):
                    yield chunk
                    try:
                        # NDJSON chunks have trailing \n — strip before parsing
                        data = json.loads(chunk.rstrip())
                        if data.get("type") == "done":
                            full_response = data.get("full_content", "")
                    except json.JSONDecodeError:
                        pass
                    except Exception:
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
                    "X-Session-Token": create_session_token(session_id) if session_id else "",
                },
            )

        # Non-streaming response
        response = await call_openrouter(
            selected_model, conversation, web_tools_enabled, session_id
        )
        runtime = int((time.time() - start_time) * 1000)

        result = {
            "answer": response["answer"],
            "source": "OpenRouter",
            "model": response["model"],
            "routing_tier": routing_tier,
            "session_id": session_id,
            "session_token": create_session_token(session_id) if session_id else None,
            "category": "General",
            "confidence": 0.95,
            "runtime": f"{runtime}ms",
            "usage": response.get("usage"),
            "timestamp": int(time.time() * 1000),
            "knowledge_context": bool(site_context),
            "web_tools": web_tools_enabled,
            "web_engine": "parallel" if web_tools_enabled else None,
        }

        if session_id:
            update_session_memory(session_id, message, response["answer"])

        return result

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        logger.error(f"❌ Chat endpoint HTTP status error: {status}")
        reason = f"OpenRouter HTTP {status}"
        if status == 402:
            reason = "OpenRouter HTTP 402 insufficient credits"
        return build_local_chat_payload(
            message,
            site_context,
            start_time,
            reason=reason,
        )
    except httpx.RequestError as e:
        logger.error(f"❌ Chat endpoint connection/request error: {str(e)}")
        return build_local_chat_payload(
            message,
            site_context,
            start_time,
            reason=f"OpenRouter network ({type(e).__name__})",
        )
    except asyncio.TimeoutError:
        logger.error("❌ Chat endpoint request timed out")
        return build_local_chat_payload(
            message,
            site_context,
            start_time,
            reason="OpenRouter timeout",
        )
    except Exception as e:
        logger.error(f"❌ Chat endpoint unexpected error: {type(e).__name__} - {str(e)}", exc_info=True)
        raise api_error(
            code="CHAT_INTERNAL_ERROR",
            message="Something went wrong while processing your message. Please try again.",
            status=500,
        )


@router.get("/api/chat/health", tags=["core"], summary="Chatbot AI health")
async def chat_health():
    """Report whether OpenRouter-backed chat is configured and reachable."""
    api_key = get_openrouter_api_key()
    model = get_default_model()
    status = "degraded"
    provider_status = "local_only"
    message = "OpenRouter API key is not configured; chat runs in local intelligence mode."

    if api_key:
        provider_status = "configured"
        message = "OpenRouter API key is configured."
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=5.0,
                )
            if response.status_code == 200:
                status = "healthy"
                provider_status = "online"
                message = "OpenRouter model catalog is reachable."
            else:
                status = "unhealthy"
                provider_status = "error"
                message = f"OpenRouter returned HTTP {response.status_code}."
        except Exception:
            status = "unhealthy"
            provider_status = "error"
            message = "OpenRouter health check failed."

    return {
        "success": True,
        "status": status,
        "provider": "openrouter",
        "provider_status": provider_status,
        "streaming": "ndjson",
        "model": model,
        "message": message,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/api/models")
async def get_models():
    """Get available AI models"""
    current = get_default_model()
    return {
        "models": MODELS,
        "default": current,
        "current": current,
        "ai_configured": bool(get_openrouter_api_key()),
        "routing": {
            "portfolio": PRIMARY_OPENROUTER_MODEL,
            "auto": AUTO_ROUTER_MODEL,
            "fusion": FUSION_MODEL,
            "fallback": FALLBACK_OPENROUTER_MODEL,
        },
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
async def get_conversation(session_id: str, request: Request):
    """Get conversation history for a session"""
    token = request.headers.get("x-session-token", "").strip()
    if not verify_session_token(session_id, token):
        raise HTTPException(status_code=403, detail="Session token required")
    history = get_session_memory(session_id)
    return {"session_id": session_id, "messages": history, "count": len(history)}


@router.delete("/api/conversation/{session_id}")
async def clear_conversation(session_id: str, request: Request):
    """Clear conversation history"""
    token = request.headers.get("x-session-token", "").strip()
    if not verify_session_token(session_id, token):
        raise HTTPException(status_code=403, detail="Session token required")
    from api.config import conversation_memory
    if session_id in conversation_memory:
        del conversation_memory[session_id]
    return {"status": "cleared", "session_id": session_id}
