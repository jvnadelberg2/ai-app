import os
import requests

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

def complete(prompt: str, model: str | None = None, temperature: float = 0.7, max_tokens: int | None = None) -> str:
    m = model or OLLAMA_MODEL
    payload = {"model": m, "prompt": prompt, "stream": False}
    opts = {}
    if temperature is not None:
        opts["temperature"] = float(temperature)
    if max_tokens is not None:
        opts["num_predict"] = int(max_tokens)
    if opts:
        payload["options"] = opts
    r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60)
    r.raise_for_status()
    return r.json().get("response", "")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m source.ai_client 'your prompt here'")
        raise SystemExit(1)
    print(complete(sys.argv[1]))
