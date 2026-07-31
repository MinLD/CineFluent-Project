<div align="center">
  <img src="./client/Fe_CineFluent/public/img/loaibonen.png" width="720" alt="CineFluent" />

  <h1>CineFluent</h1>

  <p><strong>Learn English naturally through movies, bilingual subtitles, adaptive AI and real-time practice.</strong></p>

  <p>
    <a href="https://github.com/MinLD/CineFluent-Project">
      <img src="https://img.shields.io/badge/Repository-CineFluent-181717?logo=github" alt="Repository" />
    </a>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000000" alt="React 19" />
    <img src="https://img.shields.io/badge/Flask-3.1-000000?logo=flask" alt="Flask 3.1" />
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL 8" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  </p>
</div>

What is CineFluent?

CineFluent turns movie subtitles into personalized English lessons. Learners watch films, interact with bilingual subtitles, save vocabulary, practise listening and speaking, and receive grammar exercises selected from their own learning history.

Learn with movies

Adaptive grammar AI

Bilingual subtitles, contextual lookup, flashcards and watch history.

XLM-RoBERTa classifies 12 English tenses while DKT estimates learner mastery.

Practise in context

Learn together

Dictation, shadowing and AI-generated cloze exercises from real dialogue.

One-to-one video calls with WebRTC/PeerJS and Socket.IO signaling.

Why It Stands Out

Adaptive playback: CineFluent looks ahead during a movie and pauses only when the learner is likely to struggle with an upcoming grammar pattern.

Efficient subtitle processing: AI metadata is injected into VTT files, parsed in a Web Worker, and searched in O(log n) time.

Context-aware AI: Gemini answers through Product-RAG instead of relying only on a general model response.

Production-style media delivery: Flask authorizes Google Drive media while Nginx handles the stream through X-Accel-Redirect.

Main Features

Area

Highlights

Movies

YouTube/Google Drive sources, TMDB metadata, watch history and Nginx streaming

Subtitles

Bilingual SRT/VTT, timestamp synchronization and contextual word lookup

Learning

Flashcards, dictation, shadowing, typing games and learning roadmaps

Adaptive AI

Grammar classification, cloze generation and mastery prediction

AI assistant

Gemini with Product-RAG using JSON or Qdrant vector storage

Real-time

WebRTC/PeerJS video calls and Socket.IO events

Administration

Users, roles, categories, movies, subtitles, reports and requests

The AI Learning Loop

flowchart LR
    Subtitle[Movie Subtitle] --> Grammar[XLM-RoBERTa]
    Grammar --> VTT[VTT + AI Metadata]
    VTT --> Player[Next.js Player]
    Player --> DKT[DKT Mastery Check]
    DKT --> Quiz[Adaptive Cloze Quiz]
    Quiz --> History[Learning History]
    History --> DKT

AI component

Role in CineFluent

XLM-RoBERTa

Classifies subtitle sentences into 12 English tense categories.

spaCy

Identifies verbs and generates distractors for cloze exercises.

DKT-LSTM + ONNX Runtime

Predicts mastery from historical correct/incorrect attempts.

Gemini + Product-RAG

Produces answers grounded in CineFluent's product and learning knowledge.

Architecture

flowchart TD
    Browser[Web Browser] --> Nginx[Nginx Gateway]
    Nginx --> Next[Next.js 16]
    Nginx --> Flask[Flask API + Socket.IO]
    Flask --> MySQL[(MySQL 8)]
    Flask --> Media[Google Drive + Cloudinary]
    Flask --> AI[Grammar AI + DKT + RAG]
    Browser <--> Peer[WebRTC Peer]

Tech Stack

<p>
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000000" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Ant_Design-6-0170FE?logo=antdesign&logoColor=white" alt="Ant Design" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-3.1-000000?logo=flask" alt="Flask" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/WebRTC-PeerJS-333333?logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white" alt="Nginx" />
</p>

<details>
<summary><strong>Repository structure</strong></summary>

CineFluent-Project/
├── client/Fe_CineFluent/          # Next.js frontend
├── server/be_flask_cinefluent/    # Flask API, AI services and database
├── nginx/                         # Gateway and media streaming
├── rag_data/                      # Product-RAG knowledge sources
├── docs/                          # Technical notes and runbooks
├── docker-compose.yml             # Full application stack
└── .github/workflows/deploy.yml   # Docker and AWS/VPS deployment

</details>

<details>
<summary><strong>Run with Docker Compose</strong></summary>

Prerequisites

Git, Docker and Docker Compose

Google OAuth client

Google service-account JSON with Drive access

Cloudinary, Gemini and TMDB credentials

Start the project

git clone https://github.com/MinLD/CineFluent-Project.git
cd CineFluent-Project
docker compose up --build -d
docker compose exec backend flask db upgrade
docker compose exec backend flask seed --with-admin

Local services

Service

Address

Nginx gateway

http://localhost

Next.js frontend

http://localhost:3000

Flask backend

http://localhost:5000

MySQL

localhost:3306

# Follow logs
docker compose logs -f

# Stop without deleting database data
docker compose down

</details>

<details>
<summary><strong>⚙️ Environment configuration</strong></summary>

Create .env in the repository root:

# MySQL
MYSQL_ROOT_PASSWORD=change_me
MYSQL_DATABASE=cinefluent
DATABASE_URL=mysql+pymysql://root:change_me@db:3306/cinefluent
PRODUCTION_DATABASE_URL=

# Flask and administrator
SECRET_KEY=replace_with_a_long_random_secret
FLASK_ENV=development
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me

# Google authentication
GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# External services
GEMINI_API_KEY=
TMDB_API_KEY=

# Application URLs
URL_BACKEND_INTERNAL=http://backend:5000/api
URL_BACKEND_LOCAL=http://127.0.0.1:5000/api
NEXT_PUBLIC_URL_BACKEND_LOCAL=http://127.0.0.1:5000
NEXT_PUBLIC_URL_FRONTEND_LOCAL=http://localhost:3000
NEXT_PUBLIC_URL_FRONTEND_PRODUCTION=
NEXT_PUBLIC_URL_FRONTEND_PROXY=/apiFe

# Product-RAG
PRODUCT_RAG_STORE=json
PRODUCT_RAG_CHUNK_SIZE=1200
PRODUCT_RAG_CHUNK_OVERLAP=120
PRODUCT_RAG_EMBEDDING_DIM=256
PRODUCT_RAG_JSON_STORE=

# Optional Qdrant store
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=cinefluent_product_rag

Place the Google service-account file at:

server/be_flask_cinefluent/app/utils/service-account.json

Do not commit .env, service-account files, API keys or private media URLs.

</details>

<details>
<summary><strong>💻 Run frontend and backend manually</strong></summary>

Frontend

cd client/Fe_CineFluent
npm ci
npm run dev

Backend

cd server/be_flask_cinefluent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python run.py

On Windows PowerShell:

.venv\Scripts\Activate.ps1

</details>

<details>
<summary><strong>Main API modules</strong></summary>

Prefix

Responsibility

/api/auth

Authentication and token refresh

/api/users

Users and profiles

/api/videos

Movies, streaming, subtitles, history and AI analysis

/api/flashcards

Vocabulary and flashcard workflows

/api/learning

Exercises and learning activities

/api/kt

Knowledge tracing and mastery updates

/api/ai

AI-assisted learning features

/api/chat

Product-RAG assistant

/api/roadmap

Personalized learning roadmaps

/api/classrooms

Classroom features

/api/admin-dashboard

Administrative analytics

</details>

Deployment

GitHub Actions builds the frontend and backend images, pushes them to Docker Hub, and deploys the Docker Compose stack to AWS EC2/VPS through SSH.

Author

Do Dang Minh Luan · Full-stack DeveloperGitHub · CineFluent Repository

