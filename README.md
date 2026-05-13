# ⚖️ CaseMap — AI-Powered Legal Timeline Builder

**Turn 1000 pages into a timeline in minutes.** Drag-and-drop legal documents, let AI extract every date and event, and get an interactive visual timeline instantly.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster)
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Configure Environment
```bash
# Edit server/.env with your credentials
MONGODB_URI=mongodb://localhost:27017/casemap   # or your Atlas URI
GEMINI_API_KEY=your_key_here
```

### 2. Install & Run
```bash
# Terminal 1 — Backend
cd server
npm install
npm run dev

# Terminal 2 — Frontend
cd client
npm install
npm run dev
```

### 3. Open
Visit **http://localhost:3000**

## Features
- 📁 **Drag & Drop Upload** — PDF, DOCX, TXT (up to 50 files)
- 🤖 **AI Extraction** — Gemini AI finds every date, event, and party
- 📅 **Interactive Timeline** — Zoom, scroll, click events for details
- 🏷️ **Category Filters** — Filing, hearing, deposition, contract, correspondence
- ✏️ **Manual Events** — Add or edit events by hand
- 📥 **Export** — CSV, JSON, or Print-to-PDF
- 🎯 **Confidence Scoring** — See how certain the AI is about each event

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Timeline | vis-timeline |
| Backend | Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini |
