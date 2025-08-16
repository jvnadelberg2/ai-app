import os, json
from typing import AsyncGenerator, List, Dict
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import httpx

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.environ.get("MODEL_NAME", "phi3:mini")

app = FastAPI(title="Local AI Chatbot (Ollama)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/models")
async def list_models():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            r.raise_for_status()
            data = r.json()
            models = [{"name": m.get("name",""), "provider": "ollama", "installed": True} for m in data.get("models", [])]
            return {"models": models}
    except Exception as e:
        return JSONResponse({"models": [], "error": str(e)}, status_code=200)

@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    messages: List[Dict[str, str]] = body.get("messages", [])
    model = body.get("model", DEFAULT_MODEL)
    if not isinstance(messages, list) or not messages:
        raise HTTPException(status_code=400, detail="messages[] required")

    async def generate() -> AsyncGenerator[bytes, None]:
        payload = {"model": model, "messages": messages, "stream": True}
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
                try:
                    resp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    detail = await resp.aread()
                    raise HTTPException(status_code=502, detail=f"Ollama error: {e} {detail!r}")
                async for line in resp.aiter_lines():
                    if not line: 
                        continue
                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if obj.get("done"):
                        break
                    chunk = (obj.get("message") or {}).get("content", "")
                    if chunk:
                        yield chunk.encode("utf-8")
        yield b"\n"

    return StreamingResponse(generate(), media_type="text/plain")

