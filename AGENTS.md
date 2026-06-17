# SoroLend Contributor Onboarding Guide

## Architecture Overview

SoroLend is a decentralized lending & borrowing protocol built on Stellar Soroban. The stack is:

```
┌───────────────────────────────┐
│  Frontend (Angular 17 + NgRx) │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│ Backend (NestJS + PostgreSQL) │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│  Smart Contracts (Soroban)    │
└───────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20+
- Rust 1.75+
- Docker & Docker Compose
- PostgreSQL 15+ (for local dev)
- Redis 7+ (for local dev)

### Local Development Setup

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd sorolend
   ```

2. Copy .env.example to .env and update variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development stack with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. The services will be available at:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379
   - RabbitMQ: localhost:5672, management UI at http://localhost:15672

### Development Commands

#### Backend
```bash
cd backend
npm install
npm run start:dev
npm run test
npm run lint
```

#### Frontend
```bash
cd frontend
npm install
npm start
npm run test
npm run lint
```

#### Smart Contracts
```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
cargo test
cargo clippy
```

## Coding Conventions

### TypeScript/JavaScript
- Use TypeScript for all new files
- Follow ESLint rules defined in .eslintrc.js
- Use Prettier for formatting (configured in .prettierrc)

### Rust
- Follow Rust's official style guide
- Use clippy to catch common mistakes
- Write tests for all new functionality

## Repository Structure

```
sorolend/
├── contracts/          # Soroban smart contracts
├── backend/            # NestJS API server
├── frontend/           # Angular 17 SPA
├── infrastructure/     # Kubernetes, Terraform, Docker
├── .github/            # CI/CD workflows
└── docs/               # Project documentation
```
