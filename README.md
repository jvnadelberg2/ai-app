# AI App — Local RAG Server

A local Retrieval-Augmented Generation (RAG) system for querying documents and generating grounded AI responses.

This project demonstrates how structured content, retrieval pipelines, and LLMs work together to produce accurate, context-aware answers.

---

## Overview

This application provides a local AI system that:

- Ingests and indexes documents
- Retrieves relevant context based on user queries
- Generates responses grounded in retrieved content
- Supports "doc-only" answering to reduce hallucinations

It is designed as a **reference implementation** for building AI-powered knowledge systems.

---

## Key Concepts

### Retrieval-Augmented Generation (RAG)
Instead of relying only on model memory, the system retrieves relevant documents and injects them into the prompt to improve accuracy.

### Doc-Only Ask
Responses are constrained to retrieved content, ensuring answers are based on actual source material.

### Structured Content
The quality of AI output depends heavily on how content is organized, indexed, and retrieved.

---

## Features

- Local RAG pipeline (no external dependency required for core flow)
- Document ingestion and indexing
- Context-aware query processing
- Prompt construction for grounded responses
- Separation of retrieval and generation layers
- Logs and test structure for validation

---

## Architecture

User Query  
↓  
Retriever (search relevant documents)  
↓  
Context Builder (assemble prompt context)  
↓  
LLM (generate response)  
↓  
Response Output  

---

## Project Structure

ai-app/  
├── data/          # Documents for ingestion  
├── docs/          # Supporting documentation  
├── logs/          # Runtime logs  
├── scripts/       # Utility scripts  
├── src/           # Core application logic  
├── static/        # Static assets  
├── tests/         # Test cases  
├── Makefile       # Build and run commands  
├── requirements.txt  
└── pyproject.toml  

---

## Getting Started

### Prerequisites

- Python 3.9+
- pip or virtualenv
- (Optional) Local LLM runtime or API access

---

### Installation

    git clone https://github.com/jvnadelberg2/ai-app.git
    cd ai-app

    python -m venv venv
    source venv/bin/activate   # macOS/Linux
    # venv\Scripts\activate    # Windows

    pip install -r requirements.txt

---

### Running the App

    make run

Or:

    python -m src.main

---

### Running Tests

    make test

---

## Usage

1. Add documents to the `data/` directory  
2. Run the ingestion/indexing process  
3. Submit a query  
4. System retrieves relevant content  
5. LLM generates a grounded response  

---

## Example Workflow

Input:  
"What are the key steps in the deployment process?"

System:
1. Retrieves matching documents  
2. Builds context window  
3. Sends structured prompt to LLM  
4. Returns response based only on retrieved content  

---

## Why This Project Matters

This project demonstrates:

- How content structure affects AI output quality  
- How retrieval improves accuracy and reduces hallucinations  
- How to design systems where **content, APIs, and AI work together**  

It is especially relevant for:

- AI product development  
- Knowledge systems and documentation platforms  
- Developer tools and internal search systems  

---

## Future Improvements

- Better ranking and retrieval tuning  
- Embedding optimization  
- UI for interactive querying  
- Streaming responses  
- Evaluation framework for answer quality  

---

## Author

Jon Nadelberg  
Senior Technical Writer | AI Systems | Developer Platforms  

---

## License

MIT (or specify if different)
