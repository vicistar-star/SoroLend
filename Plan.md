# SoroLend — 10-Day Intensive Development Plan

**Target: ~65% completion — robust foundation for contributors**

---

## Day 1 — Monorepo Scaffolding & Smart Contract Foundation

**Goal:** Establish project structure, toolchain, and core lending pool contract.

**Prompts:**
- Initialize monorepo with `contracts/`, `backend/`, `frontend/`, `infrastructure/`, `docs/`, `.github/` directories
- Set up Rust workspace in `contracts/` with `Cargo.toml` workspace, `soroban-sdk` dependency, and WASM target configuration
- Implement `lending-pool/` contract skeleton: `lib.rs` (initialize, supply, withdraw, borrow, repay stubs), `storage.rs` (pool config, user positions), `interest.rs` (two-slope kinked rate model), `math.rs` (fixed-point math utilities), `events.rs` (supply/deposit/borrow/repay event definitions)
- Write unit tests for interest rate model at kink threshold (80% utilization)
- Create `.env.example`, `Makefile` with common commands (`make build`, `make test`, `make lint`)

**Deliverables:** `contracts/Cargo.toml`, `contracts/lending-pool/src/` (lib, storage, interest, math, events), `Makefile`, `.env.example`

---

## Day 2 — Collateral Manager & sToken Contracts

**Goal:** Collateral management and yield-bearing receipt token contracts.

**Prompts:**
- Implement `collateral-manager/` contract: `deposit_collateral`, `withdraw_collateral`, `get_health_factor`, `get_collateral_value_usd`, `get_available_borrow_usd` — health factor formula: `(Σ collateral_i × price_i × liq_threshold_i) / total_borrow_usd`
- Implement `stoken/` contract: ERC4626-like yield-bearing receipt token with `mint`, `burn`, `balance_of`, `convert_to_shares`, `convert_to_assets`
- Wire sToken minting into lending pool's `supply()` and burning into `withdraw()`
- Write tests: collateral health factor computation with valid/invalid states, sToken share conversion math


**Deliverables:** `contracts/collateral-manager/src/`, `contracts/stoken/src/`, updated lending pool integration

---

## Day 3 — Liquidation Engine & Price Oracle Contracts

**Goal:** On-chain liquidation logic and decentralized price oracle aggregation.

**Prompts:**
- Implement `liquidation/` contract: `liquidate` function that seizes collateral at liquidation threshold (120%) with penalty (5-15%)
- Implement `price-oracle/` contract: multi-source price aggregation with TWAP protection, `get_price`, `set_price` (keeper-only), deviation check before update
- Add `flash-loan/` contract: single-transaction uncollateralized loan with fee callback
- Integrate oracle into collateral manager for health factor price lookups
- Write tests: liquidation with correct bonus calculation, TWAP manipulation resistance check

**Deliverables:** `contracts/liquidation/src/`, `contracts/price-oracle/src/`, `contracts/flash-loan/src/`, integration tests

---

## Day 4 — Backend Scaffolding & Database Layer

**Goal:** NestJS backend foundation with database entities and authentication.

**Prompts:**
- Scaffold NestJS backend (`backend/`) with `@nestjs/cli`: `AppModule`, `ConfigModule` (validated `.env`), `DatabaseModule` (TypeORM + PostgreSQL), `CacheModule` (Redis)
- Define all TypeORM entities matching README SQL schema: `User`, `Asset`, `SupplyPosition`, `BorrowPosition`, `CollateralPosition`, `MarketSnapshot`, `LiquidationEvent`, `PriceFeed` — with proper relations, indices, and `NUMERIC(38,18)` precision
- Implement `AuthModule`: `WalletAuthService` with challenge/verify flow (nonce generation, Redis storage, Stellar signature verification stub), `JwtStrategy` (Passport), `WalletStrategy`, auth controller endpoints (`POST /auth/challenge`, `POST /auth/verify`)
- Add global pipes (validation), filters (exception), and interceptors (logging, transform)
- Write unit tests for auth service challenge/verify flow

**Deliverables:** `backend/src/` (app module, config, database entities, auth module), `backend/test/unit/auth`

---

## Day 5 — Lending & Borrowing Backend Modules

**Goal:** Core lending and borrowing REST APIs + WebSocket gateway.

**Prompts:**
- Implement `LendingModule`: `LendingService` (supply/withdraw business logic with Soroban contract call stubs), `LendingController` (`GET /markets`, `GET /markets/:asset`, `POST /supply`, `POST /withdraw`, `GET /positions/:address`), `LendingGateway` (WebSocket for real-time market updates), `LendingScheduler` (cron: interest accrual sync every 60s)
- Implement `BorrowingModule`: `BorrowingService` (borrow/repay logic with health factor validation), `BorrowingController` (`POST /borrow`, `POST /repay`, `GET /positions/:address`, `GET /health/:address`)
- Implement `CollateralModule`: `CollateralService` (deposit/withdraw, portfolio tracking), `CollateralController` (`POST /deposit`, `POST /withdraw`, `GET /portfolio/:addr`, `GET /max-borrow/:addr`)
- Define DTOs with `class-validator` decorators for all endpoints
- Write integration tests for lending/borrowing flow (using test DB)

**Deliverables:** `backend/src/modules/lending/`, `borrowing/`, `collateral/`, DTOs, integration tests

---

## Day 6 — Liquidation Engine, Oracle & Indexer Modules

**Goal:** Off-chain liquidation bot, oracle aggregation, and blockchain event indexer.

**Prompts:**
- Implement `LiquidationModule`: `LiquidationService` (health factor query, at-risk position detection with 1.05 buffer), `LiquidationBot` (`@Cron('*/15 * * * * *')` scan-and-liquidate loop with optimal debt cover calculation), `LiquidationGateway` (real-time liquidation events via WebSocket)
- Implement `OracleModule`: `OracleAggregatorService` (Band + Pyth price feed stubs with fallback), `TwapService` (time-weighted average price over N periods), `OracleScheduler` (cron: refresh prices every 30s with deviation check)
- Implement `IndexerModule`: `StellarIndexerService` (poll Soroban RPC for contract events), `EventProcessorService` (parse and persist supply/borrow/liquidation events), `IndexerGateway` (push events to frontend via WebSocket)
- Write unit tests for liquidation bot position filtering and TWAP calculation

**Deliverables:** `backend/src/modules/liquidation/`, `oracle/`, `indexer/`, unit tests

---

## Day 7 — Governance, Notifications & Analytics Modules

**Goal:** DAO governance, multi-channel notifications, and protocol analytics.

**Prompts:**
- Implement `GovernanceModule`: `GovernanceService` (proposal creation, voting, execution), `GovernanceController` (`GET /proposals`, `POST /proposals`, `POST /vote`, `GET /voting-power`), proposal status lifecycle (Pending → Active → Succeeded/Defeated → Executed)
- Implement `NotificationModule`: `EmailService` (SendGrid stub), `PushService` (web push), `AlertService` (health factor threshold alerts at 1.3, 1.1), notification preferences per user
- Implement `AnalyticsModule`: `TvlService` (total value locked computation across all pools), `ApyHistoryService` (time-series APY snapshots), `ProtocolStatsService` (global metrics: active users, total borrows, liquidation volume), `AnalyticsController` (`GET /tvl`, `GET /apy-history`, `GET /protocol-stats`, `GET /user/:address`)
- Write tests for governance voting quorum math and TVL aggregation

**Deliverables:** `backend/src/modules/governance/`, `notifications/`, `analytics/`, unit/integration tests

---

## Day 8 — Frontend Scaffolding & Core Services

**Goal:** Angular 17 app with authentication, wallet integration, and NgRx store.

**Prompts:**
- Scaffold Angular 17 standalone app in `frontend/` with routing, lazy-loaded feature modules
- Set up NgRx store: auth slice (wallet address, JWT, connection state), markets slice, portfolio slice, prices slice, governance slice — with effects for API calls
- Implement `CoreModule` services: `AuthService` (challenge/verify JWT flow), `WalletService` (Freighter connect/sign/signMessage), `StellarService` (Soroban contract interaction stubs), `NotificationService` (WebSocket connection + event handling)
- Create layout components: `HeaderComponent` (wallet connect button, nav), `SidebarComponent` (market list), `FooterComponent`
- Build `WalletConnectComponent` (Freighter connection flow with error handling) and `HealthFactorBadgeComponent` (color-coded health factor with tooltip)
- Write Jest unit tests for wallet service connection flow and auth service token refresh

**Deliverables:** `frontend/src/app/` (core services, layout, shared components), NgRx store setup, Jest tests

---

## Day 9 — Frontend Feature Pages & State Management

**Goal:** All main UI feature pages with real-time data binding.

**Prompts:**
- Implement `DashboardComponent`: portfolio overview with health factor (signal-based reactivity), supply/borrow APY, liquidation price computed signal
- Implement `LendingComponent`: market list with APY, supply/withdraw forms with token input validation, transaction status modal
- Implement `BorrowingComponent`: borrow/repay forms, max-borrow calculation, position health display
- Implement `CollateralComponent`: deposit/withdraw forms, portfolio breakdown by asset, available-to-borrow gauge
- Implement `PortfolioComponent`: consolidated view of all positions (supply, borrow, collateral) with net APY, historical performance chart stub
- Implement `GovernanceComponent`: proposal list with vote buttons, proposal detail view, voting power display
- Wire all pages to NgRx store selectors and effects; add loading/error states
- Add SCSS styles following `_variables.scss`, `_typography.scss`, `_mixins.scss`, `_themes.scss`

**Deliverables:** `frontend/src/app/features/` (all feature modules), shared styles, Angular tests for components

---

## Day 10 — Infrastructure, CI/CD & Integration

**Goal:** Docker, Kubernetes, CI/CD pipelines, and end-to-end integration verification.

**Prompts:**
- Write `docker-compose.yml` matching README spec: postgres 15, redis 7, rabbitmq 3.12, backend (dev target with volume mount), frontend (dev target)
- Write backend `Dockerfile` (multi-stage: development + production targets)
- Write frontend `Dockerfile` (multi-stage: dev + nginx-alpine production) and `nginx.conf`
- Write Kubernetes manifests: `backend.yaml` (3 replicas, rolling update, resource limits, health probes), `frontend.yaml`, `indexer.yaml`, `liquidation-bot.yaml`, `services/`, `ingress/`, `configmaps/` — matching README spec
- Write `infrastructure/terraform/` skeleton: `main.tf` with VPC and EKS module stubs
- Write CI pipeline `.github/workflows/ci.yml`: test-contracts (cargo test + clippy), test-backend (npm ci + lint + test:cov with postgres service), test-frontend (npm ci + lint + test:ci + build), security-scan (Snyk + Trivy stubs)
- Write CD pipelines: `cd-staging.yml` and `cd-production.yml` (deploy to K8s with image tag)
- Run full integration test: `docker compose up --build`, verify backend health endpoint, frontend compiles, `cargo test` passes
- Write `AGENTS.md` with onboarding notes for contributors (architecture overview, setup commands, coding conventions)

**Deliverables:** `docker-compose.yml`, `Dockerfile`s, `nginx.conf`, `infrastructure/` (K8s + Terraform), `.github/workflows/` (CI + CD), `AGENTS.md`, integration verified
