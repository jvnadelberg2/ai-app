ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT=3002

diag() {
  echo "root: $ROOT"
  echo -n "node: "; node -v 2>/dev/null || echo missing
  echo -n "npm: "; npm -v 2>/dev/null || echo missing
  echo -n "curl: "; curl --version 1>/dev/null 2>&1 && echo ok || echo missing
  echo -n "jq: "; jq --version 1>/dev/null 2>&1 && echo ok || echo missing
  [ -f server.js ] && echo "server.js: ok" || echo "server.js: missing"
  [ -f src/config.json ] && echo "src/config.json: ok" || echo "src/config.json: missing"
  [ -f static/index.html ] && echo "static/index.html: ok" || echo "static/index.html: missing"
}

start() {
  pkill -f 'node server.js' 2>/dev/null || true
  kill -9 $(lsof -ti tcp:$PORT) 2>/dev/null || true
  PORT=$PORT npm start >/dev/null 2>server.log &
  for _ in $(seq 1 50); do
    sleep 0.1
    if curl -fsS "http://localhost:$PORT/health" >/dev/null 2>&1; then
      curl -s "http://localhost:$PORT/health" | jq .
      return 0
    fi
  done
  echo "server failed to start"
  tail -n +1 server.log
  return 0
}

ensure_up() {
  curl -fsS "http://localhost:$PORT/health" >/dev/null 2>&1 || start >/dev/null 2>&1
}

stop() {
  pkill -f 'node server.js' 2>/dev/null || true
  kill -9 $(lsof -ti tcp:$PORT) 2>/dev/null || true
  echo "stopped"
}

health() {
  curl -s "http://localhost:$PORT/health" | jq .
}

chat_line() {
  ensure_up
  msg="$1"
  if [ -z "$msg" ]; then echo "empty"; return 0; fi
  curl -s -X POST "http://localhost:$PORT/ai/complete" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg input "$msg" '{input:$input}')" | jq .
}

chat() {
  read -r -p "prompt> " PROMPT || return 0
  chat_line "$PROMPT"
}

index_line() {
  ensure_up
  p="${1:-./docs}"
  curl -s -X POST "http://localhost:$PORT/rag/index" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg p "$p" '{paths:[$p]}')" | jq .
}

ask_line() {
  ensure_up
  q="$1"
  if [ -z "$q" ]; then echo "empty"; return 0; fi
  curl -s -X POST "http://localhost:$PORT/rag/answer" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg q "$q" '{q:$q}')" | jq .
}

ask() {
  read -r -p "question> " Q || return 0
  ask_line "$Q"
}

logs() {
  tail -n 50 server.log
}

while true; do
  echo
  echo "s) start   x) stop    h) health"
  echo "c) chat    i) index   a) ask"
  echo "l) logs    d) diag
