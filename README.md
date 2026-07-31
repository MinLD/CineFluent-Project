CineFluent

An AI-powered English-learning platform that turns movies and subtitles into interactive, personalized learning experiences.



Repository

Overview

CineFluent is a full-stack platform for learning English through movies. It combines synchronized bilingual subtitles, contextual vocabulary lookup, flashcards, dictation, shadowing, adaptive grammar exercises, an AI learning assistant, and real-time communication.

The system does more than play videos. It analyzes subtitle sentences, tracks each learner's grammar mastery, and pauses playback to display a contextual cloze exercise when the learner is likely to struggle with an upcoming sentence.

Core Features

Interactive movie learning

Watch movies with timestamp-synchronized bilingual subtitles.

Look up words and phrases directly from subtitle lines.

Save vocabulary as personal flashcards.

Practise listening through subtitle-based dictation.

Practise pronunciation and fluency through shadowing.

Resume movies from saved watch history.

Import movie metadata through TMDB and process YouTube sources with yt-dlp.

Adaptive grammar learning

Classify subtitle sentences across 12 English tense categories with XLM-RoBERTa.

Generate contextual cloze exercises from subtitle sentences.

Use spaCy to identify main verbs and generate distractors.

Track correct and incorrect attempts with Deep Knowledge Tracing.

Estimate mastery probability for each grammar tag.

Look ahead during playback and trigger a quiz when predicted mastery is low.

Flashcards and personalized practice

Build a personal vocabulary collection from movie subtitles.

Generate exercises from saved flashcards and movie context.

Track exercise history and learning progress.

Provide learning roadmaps and grammar review activities.

AI assistant and Product-RAG

Use Gemini to answer contextual learning and product-support questions.

Retrieve relevant CineFluent knowledge before generating a response.

Run Product-RAG with a local JSON vector store by default.

Switch to Qdrant when an external vector database is required.

Real-time communication

Support one-to-one audio and video calls with WebRTC/PeerJS.

Use Socket.IO and Flask-SocketIO for signaling and real-time events.

Route production WebSocket traffic through Nginx.

Authentication and administration

Support JWT authentication with access and refresh tokens.

Support Google OAuth authentication.

Apply role-based access control for users and administrators.

Manage users, roles, categories, movies, subtitles, reports, and movie requests.

Store uploaded images through Cloudinary.

Adaptive Learning Pipeline

An administrator uploads bilingual subtitles for a movie.

XLM-RoBERTa classifies subtitle sentences into 12 grammar tense categories.

The backend generates cloze metadata and injects it into the exported VTT file.

A Web Worker parses the VTT file outside the React render cycle.

Binary search finds the current and upcoming subtitle in O(log n) time.

DKT estimates whether the learner is likely to answer the upcoming grammar item correctly.

If mastery is low, CineFluent pauses the video and opens an adaptive cloze exercise.

The learner's result is stored and used to update future mastery predictions.

System Architecture

flowchart TD
    Browser[Web Browser] --> Gateway[Nginx Gateway]
    Gateway --> Frontend[Next.js 16 Frontend]
    Gateway --> Backend[Flask REST API and Socket.IO]
    Backend --> Database[(MySQL 8)]
    Backend --> Media[Google Drive and Cloudinary]
    Backend --> LearningAI[XLM-RoBERTa, DKT and spaCy]
    Backend --> Assistant[Gemini and Product-RAG]
    Browser <--> Peer[WebRTC Peer]

Main data flows

Video streaming: Flask authorizes the request, then Nginx uses X-Accel-Redirect to proxy the Google Drive media stream efficiently.

Subtitles: SRT/VTT content is normalized, stored, exported to VTT, and enhanced with AI metadata.

Adaptive learning: Subtitle context and attempt history flow through XLM-RoBERTa and DKT before the frontend triggers an exercise.

AI assistant: Product-RAG retrieves relevant project knowledge before Gemini generates a response.

Video calls: Socket.IO handles signaling while WebRTC/PeerJS carries peer-to-peer media.

AI Components

Component

Purpose

XLM-RoBERTa

Classifies subtitle sentences into 12 English tense categories.

spaCy

Identifies verbs and helps generate cloze-test distractors.

DKT-LSTM

Models learner knowledge from historical correct/incorrect attempts.

ONNX Runtime

Runs the exported DKT model in the Flask backend.

Gemini

Generates contextual explanations and assistant responses.

Product-RAG

Retrieves CineFluent knowledge before response generation.

JSON/Qdrant vector store

Stores and searches Product-RAG embeddings.

Technology Stack

Area

Technologies

Frontend

Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Ant Design 6

Client state and data

TanStack Query, Zustand, Axios, Formik, React Hook Form

Media and real-time

HLS.js, PeerJS, Socket.IO Client, WebRTC

Backend

Python 3.11, Flask 3.1, Flask-SocketIO, Pydantic

Database

MySQL 8, SQLAlchemy 2, Flask-Migrate/Alembic

Authentication

Flask-JWT-Extended, Google OAuth 2.0, RBAC

AI and NLP

Transformers, PyTorch, XLM-RoBERTa, spaCy, ONNX Runtime, DKT-LSTM, Gemini

Retrieval

Product-RAG, JSON vector store, Qdrant

Media storage

Google Drive, Cloudinary, SRT/VTT

Infrastructure

Docker, Docker Compose, Nginx, GitHub Actions, AWS EC2/VPS

Repository Structure

CineFluent-Project/
├── client/Fe_CineFluent/          # Next.js frontend
├── server/be_flask_cinefluent/    # Flask API, AI services and database models
├── nginx/                         # Reverse proxy and media-streaming configuration
├── rag_data/                      # Product-RAG source documents
├── docs/                          # Technical notes and implementation runbooks
├── docker-compose.yml             # Local/full-stack container orchestration
└── .github/workflows/deploy.yml   # Docker build and AWS/VPS deployment workflow

Getting Started

Prerequisites

Git

Docker and Docker Compose

A Google OAuth client

A Google service-account JSON file with access to the movie storage

Cloudinary credentials

A Gemini API key

A TMDB API key for movie metadata features

1. Clone the repository

git clone https://github.com/MinLD/CineFluent-Project.git
cd CineFluent-Project

2. Create the root environment file

Create .env in the repository root. The following example contains the variables referenced by the current source code and Docker configuration:

# MySQL
MYSQL_ROOT_PASSWORD=change_me
MYSQL_DATABASE=cinefluent
DATABASE_URL=mysql+pymysql://root:change_me@db:3306/cinefluent
PRODUCTION_DATABASE_URL=

# Flask and JWT
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

# Frontend and backend URLs
URL_BACKEND_INTERNAL=http://backend:5000/api
URL_BACKEND_LOCAL=http://127.0.0.1:5000/api
NEXT_PUBLIC_URL_BACKEND_LOCAL=http://127.0.0.1:5000
NEXT_PUBLIC_URL_FRONTEND_LOCAL=http://localhost:3000
NEXT_PUBLIC_URL_FRONTEND_PRODUCTION=
NEXT_PUBLIC_URL_FRONTEND_PROXY=/apiFe

# Product-RAG: json or qdrant
PRODUCT_RAG_STORE=json
PRODUCT_RAG_CHUNK_SIZE=1200
PRODUCT_RAG_CHUNK_OVERLAP=120
PRODUCT_RAG_EMBEDDING_DIM=256
PRODUCT_RAG_JSON_STORE=

# Optional Qdrant configuration
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=cinefluent_product_rag

Generate a secure value for SECRET_KEY; do not reuse the example passwords in production.

3. Add Google Drive credentials

Place the Google service-account file at:

server/be_flask_cinefluent/app/utils/service-account.json

This path is mounted into the backend container by docker-compose.yml. Never commit the real credential file.

4. Build and start the application

docker compose up --build -d

5. Run database migrations

docker compose exec backend flask db upgrade

6. Seed roles and an administrator account

docker compose exec backend flask seed --with-admin

7. Open the services

Service

URL

Nginx gateway

http://localhost

Next.js frontend

http://localhost:3000

Flask backend

http://localhost:5000

MySQL

localhost:3306

To view container logs:

docker compose logs -f

To stop the stack without deleting database data:

docker compose down

Development Commands

Frontend

cd client/Fe_CineFluent
npm ci
npm run dev

Available scripts:

npm run dev
npm run build
npm run start
npm run lint

Backend

cd server/be_flask_cinefluent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python run.py

For Windows PowerShell, activate the virtual environment with:

.venv\Scripts\Activate.ps1

When running services outside Docker, update DATABASE_URL and the frontend/backend URL variables to use locally reachable hosts.

API Modules

The Flask application registers the following main API groups:

Prefix

Responsibility

/api/auth

Authentication and token refresh

/api/users

User and profile management

/api/videos

Movies, streaming, subtitles, watch history and AI analysis

/api/flashcards

Vocabulary and flashcard workflows

/api/learning

Exercises and learning activities

/api/kt

Knowledge tracing and mastery updates

/api/ai

AI-assisted features

/api/chat

Product-RAG learning assistant

/api/roadmap

Personalized learning roadmaps

/api/classrooms

Classroom features

/api/admin-dashboard

Administrative analytics

Deployment

The repository includes a GitHub Actions workflow that:

Builds the frontend and backend Docker images.

Pushes the images to Docker Hub.

Connects to the deployment server over SSH.

Pulls the latest configuration and images.

Restarts the Docker Compose stack.

The workflow requires repository secrets for Docker Hub, Google OAuth build configuration, and the AWS/VPS SSH connection.

Security Notes

Never commit .env, service-account files, API keys, tokens, or private movie URLs.

Use strong production values for MySQL, administrator, and Flask secrets.

Restrict the Google service account to the minimum required Drive permissions.

Keep Nginx as the public entry point in production instead of exposing Flask directly.

Review CORS origins and deployment domains before publishing a production build.

Project Information

Type: Academic research and full-stack software engineering project

Development period: December 2025 - May 2026

Primary role: Full-stack Developer

Repository: github.com/MinLD/CineFluent-Project

Author

Do Dang Minh LuanGitHub: @MinLD

