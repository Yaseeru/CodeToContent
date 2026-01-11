# CodeToContent

Transform your GitHub repositories into compelling content for LinkedIn and X (Twitter).

## Overview

CodeToContent is a developer-focused application that analyzes GitHub repositories and generates clear, human-readable content suitable for social media. The system uses deep code understanding to help developers communicate what they're building, why it matters, and what's new—especially to non-technical audiences.

## Tech Stack

- **Frontend**: React 18+ with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **AI**: Gemini 3 API
- **Authentication**: GitHub OAuth 2.0
- **Testing**: Jest, fast-check, React Testing Library, Supertest

## Project Structure

```
code-to-content/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── test/
│   │   └── main.tsx
│   └── package.json
├── backend/           # Express backend API
│   ├── src/
│   │   ├── config/
│   │   ├── test/
│   │   └── index.ts
│   └── package.json
└── package.json       # Root package with concurrent scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- GitHub OAuth App credentials
- Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd code-to-content
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your actual values
```

### Running the Application

Start both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Testing

Run all tests:
```bash
npm test
```

Run tests for specific workspace:
```bash
npm run test:backend
npm run test:frontend
```

### Building for Production

Build both frontend and backend:
```bash
npm run build
```

## Configuration

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback`
4. Copy Client ID and Client Secret to your `.env` files

### MongoDB Setup

- **Local**: Install MongoDB and use default connection string
- **Cloud**: Use MongoDB Atlas connection string

### Gemini API Setup

1. Get API key from Google AI Studio
2. Add to `backend/.env` as `GEMINI_API_KEY`

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier recommended
- Dark theme by default (Raycast-inspired)

### Testing Strategy

- **Unit tests**: Specific examples and edge cases
- **Property-based tests**: Universal properties with fast-check
- **Integration tests**: End-to-end API flows

## License

ISC
