# Contributing to SoroLend

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Code Style](#code-style)

---

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Rust 1.75+ with `wasm32-unknown-unknown` target
- Docker & Docker Compose
- Freighter wallet extension (for manual testing)

### Setup

```bash
git clone https://github.com/sorolend/sorolend.git
cd sorolend
cp .env.example .env
make dev          # starts all services via Docker Compose
make migrate      # runs DB migrations
make seed         # seeds development data
```

Services:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- RabbitMQ UI: http://localhost:15672

---

## Development Workflow

1. **Find or open an issue** — check existing issues before starting work.
2. **Fork** the repository and create a branch off `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** — keep commits focused and atomic.
4. **Test** — all tests must pass; add new tests for new behaviour.
5. **Open a PR** targeting `develop`.

> **Note:** Never open PRs directly to `main`. The `main` branch is protected and only updated via releases from `develop`.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `refactor` | Code change without feature/fix |
| `chore` | Tooling, dependencies, config |
| `perf` | Performance improvement |

**Scopes:** `contracts`, `backend`, `frontend`, `infra`, `ci`

Examples:
```
feat(contracts): add flash loan repayment validation
fix(backend): correct health factor rounding error
docs(frontend): update wallet integration guide
```

---

## Pull Request Process

1. Fill out the PR template completely.
2. Ensure CI passes (lint, tests, build).
3. Request a review from at least one maintainer.
4. Address review feedback — mark conversations resolved after fixing.
5. A maintainer will merge once approved.

For **large changes** (new modules, protocol changes, breaking API changes), open an issue first to discuss the approach before writing code.

---

## Testing Requirements

| Layer | Minimum Coverage |
|-------|-----------------|
| Smart Contracts | 95% |
| Backend (unit) | 80% |
| Frontend (unit) | 75% |

```bash
# Contracts
make test-contracts

# Backend
make backend-test

# Frontend
make frontend-test
```

All new features and bug fixes must include tests. PRs that decrease overall coverage will not be merged.

---

## Code Style

### TypeScript (Backend & Frontend)

- Prettier + ESLint are configured. Run `make lint` before pushing.
- Use `async/await` over raw Promises.
- DTOs must use `class-validator` decorators.
- Never commit secrets or hardcoded credentials.

### Rust (Contracts)

- Run `cargo clippy -- -D warnings` before pushing.
- All public functions must have doc comments.
- Use fixed-point arithmetic — no floating-point in contract logic.

---

## Questions?

Open a [Discussion](https://github.com/sorolend/sorolend/discussions) or join our [Discord](https://discord.gg/sorolend).
