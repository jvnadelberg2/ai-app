VENV=.venv/bin
PORT?=8000

run:
	$(VENV)/python -m uvicorn source.main:app --host 127.0.0.1 --port $(PORT) --reload

install:
	$(VENV)/pip install -r requirements.txt

freeze:
	$(VENV)/pip freeze | grep -E '^(fastapi|uvicorn)=' > requirements.txt

lint:
	$(VENV)/ruff check .

format:
	$(VENV)/ruff format .

test:
	$(VENV)/pytest

curl:
	curl -s http://127.0.0.1:$(PORT)/health

