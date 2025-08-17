#!/usr/bin/env bash
set -euo pipefail
BASE=${BASE:-http://localhost:3002}
start() { PORT=${PORT:-3002} node server.js >server.log 2>&1 & echo $! > .server.pid; }
stop() { if [ -f .server.pid ]; then kill "$(cat .server.pid)" || true; rm -f .server.pid; else pkill -f "node server.js" || true; fi; }
health() { curl -s "$BASE/health" | jq .; }
chat() { curl -s -X POST "$BASE/ai/complete" -H 'Content-Type: application/json' -d "{\"input\":\"$*\"}" | jq .; }
index() { paths_json=$(printf '%s' "$*" | jq -R -s 'split(\" \")'); curl -s -X POST "$BASE/rag/index" -H 'Content-Type: application/json' -d "{\"paths\":$paths_json}" | jq .; }
ask() { curl -s -X POST "$BASE/rag/answer" -H 'Content-Type: application/json' -d "{\"q\":\"$*\"}" | jq .; }
logs() { tail -n 200 -f server.log; }
diag() { npm -v; node -v; }
menu() {
  while true; do
    printf "%s\n" "s) start   x) stop    h) health" "c) chat    i) index   a) ask" "l) logs    d) diag    q) quit"
    read -rp "choice> " ans
    case "$ans" in
      s) start ;;
      x) stop ;;
      h) health ;;
      c) read -rp "prompt> " p; chat "$p" ;;
      i) read -rp "paths (space-separated)> " p; index $p ;;
      a) read -rp "question> " p; ask "$p" ;;
      l) logs ;;
      d) diag ;;
      q) exit 0 ;;
      *) echo "unknown" ;;
    esac
  done
}
menu
