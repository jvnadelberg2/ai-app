#!/usr/bin/env python3
import sys, json, httpx, readline

API = "http://127.0.0.1:8000"
MODEL = "phi3:mini"
TEMP = 0.20
MAXTOK = 0  # 0 = auto
SYSTEM = "You are a concise, helpful assistant."
messages = [{"role": "system", "content": SYSTEM}]

HELP = """
Commands:
  :model <name>       set model (e.g. llama3:13b-instruct)
  :temp <0.0-1.0>     set temperature
  :maxtok <n>         set max tokens (0 = auto)
  :system             set system prompt (multi-line; end with a single '.')
  :reset              clear chat (keeps settings)
  :help               show this help
  :exit               quit
"""

def get(url):
    try:
        r = httpx.get(url, timeout=5.0)
        r.raise_for_status()
        return r.text
    except Exception as e:
        return None

def ensure_server():
    ok = get(API + "/api/health")
    if not ok:
        print("Server not reachable at", API, "\nStart it:\n  uvicorn src.server:app --reload --port 8000\n")
        sys.exit(1)

def list_models():
    try:
        r = httpx.get(API + "/api/models", timeout=10.0)
        r.raise_for_status()
        data = r.json()
        names = [m["name"] for m in data.get("models", [])]
        return names
    except Exception:
        return []

def send(user_text):
    global messages
    messages.append({"role": "user", "content": user_text})
    payload = {
        "messages": messages,
        "model": MODEL,
        "options": {"temperature": float(TEMP), "num_predict": int(MAXTOK) if MAXTOK else 0},
    }
    with httpx.stream("POST", API + "/api/chat", json=payload, timeout=None) as r:
        r.raise_for_status()
        print("\nAssistant:", end=" ", flush=True)
        acc = ""
        for chunk in r.iter_text():
            if not chunk:
                continue
            acc += chunk
            print(chunk, end="", flush=True)
        print()
    messages.append({"role": "assistant", "content": acc.strip()})

def set_system():
    global SYSTEM, messages
    print("Enter system prompt. End with a single dot on its own line:")
    lines = []
    while True:
        line = input()
        if line.strip() == ".":
            break
        lines.append(line)
    SYSTEM = "\n".join(lines).strip() or SYSTEM
    if messages and messages[0]["role"] == "system":
        messages[0]["content"] = SYSTEM
    else:
        messages.insert(0, {"role": "system", "content": SYSTEM})
    print("System prompt set.\n")

def main():
    global MODEL, TEMP, MAXTOK, messages
    ensure_server()
    print("Models:", ", ".join(list_models()) or "(unknown)")

    print(f"\nModel={MODEL}  Temp={TEMP:.2f}  MaxTok={MAXTOK}  (type :help)")
    while True:
        try:
            line = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not line:
            continue
        if line.startswith(":"):
            parts = line.split(None, 1)
            cmd = parts[0].lower()
            arg = parts[1] if len(parts) > 1 else ""
            if cmd == ":exit":
                break
            elif cmd == ":help":
                print(HELP)
            elif cmd == ":model":
                if arg:
                    MODEL = arg.strip()
                    print("Model =", MODEL)
                else:
                    print("Usage: :model <name>")
            elif cmd == ":temp":
                try:
                    TEMP = max(0.0, min(1.0, float(arg)))
                    print(f"Temp = {TEMP:.2f}")
                except Exception:
                    print("Usage: :temp <0.0-1.0>")
            elif cmd == ":maxtok":
                try:
                    v = int(arg)
                    MAXTOK = max(0, v)
                    print("MaxTok =", MAXTOK)
                except Exception:
                    print("Usage: :maxtok <int> (0=auto)")
            elif cmd == ":system":
                set_system()
            elif cmd == ":reset":
                messages = [{"role": "system", "content": SYSTEM}]
                print("Chat cleared.")
            else:
                print("Unknown command. :help")
            continue
        # normal chat turn
        try:
            send(line)
        except httpx.HTTPStatusError as e:
            print("\n[HTTP error]", e)
        except Exception as e:
            print("\n[Error]", e)

if __name__ == "__main__":
    main()

