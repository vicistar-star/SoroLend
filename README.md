# 🏦 SoroLend — Decentralized Lending & Borrowing Protocol

<div align="center">

![SoroLend Banner](https://img.shields.io/badge/SoroLend-DeFi%20Protocol-6C3BFF?style=for-the-badge&logo=ethereum&logoColor=white)

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-17.x-DD0031?style=flat-square&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7B61FF?style=flat-square&logo=stellar)](https://soroban.stellar.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A fully decentralized, non-custodial lending and borrowing protocol built on the Stellar Soroban smart contract platform — enabling permissionless access to DeFi financial services with robust collateral management, real-time liquidation engines, and institutional-grade risk controls.**

[Live Demo](https://sorolend.finance) · [Documentation](https://docs.sorolend.finance) · [API Reference](https://api.sorolend.finance/docs) · [Bug Reports](https://github.com/sorolend/sorolend/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Smart Contracts (Soroban)](#-smart-contracts-soroban)
- [Backend — NestJS](#-backend--nestjs)
- [Frontend — Angular](#-frontend--angular)
- [Infrastructure & DevOps](#-infrastructure--devops)
- [Database Design](#-database-design)
- [Security](#-security)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Monitoring & Observability](#-monitoring--observability)
- [Contributing](#-contributing)
- [Audits & Compliance](#-audits--compliance)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌐 Overview

SoroLend is a next-generation decentralized finance (DeFi) protocol built on **Stellar's Soroban** smart contract platform. It enables users to:

- **Supply** crypto assets to liquidity pools and earn dynamic interest rates
- **Borrow** assets against over-collateralized positions
- **Manage** multi-asset collateral portfolios with real-time health factor tracking
- **Participate** in governance to shape the protocol's evolution

SoroLend implements a battle-tested over-collateralization model with automated liquidations, dynamic interest rate curves, and a sophisticated risk engine — giving both retail and institutional users a secure and transparent lending experience.

### Core Protocol Mechanics

```
                    ┌──────────────────────────────────────────────┐
                    │               SOROLEND PROTOCOL              │
                    │                                              │
  Lenders ─────────▶  Liquidity Pools  ◀───────────  Borrowers   │
                    │        │                   │                │
                    │  Interest Accrual     Collateral Vault      │
                    │        │                   │                │
                    │   sTokens (yield-    Health Factor Engine   │
                    │   bearing receipts)        │                │
                    │                    Liquidation Bot          │
                    └──────────────────────────────────────────────┘
```

| Metric | Value |
|--------|-------|
| Collateralization Ratio | 150% minimum |
| Liquidation Threshold | 120% |
| Liquidation Penalty | 5–15% (asset-dependent) |
| Protocol Reserve Factor | 10% of interest |
| Supported Assets | XLM, USDC, BTC (wrapped), ETH (wrapped), and more |

---

## ✨ Key Features

### Protocol Features
- **Multi-Asset Lending Pools** — Isolated and cross-margin pools for diverse asset support
- **Dynamic Interest Rates** — Utilization-based interest rate model with kink parameters
- **Over-Collateralization** — Enforced LTV (Loan-to-Value) ratios per asset class
- **Automated Liquidations** — Real-time on-chain liquidation engine with keeper incentives
- **Flash Loans** — Single-transaction uncollateralized loans for arbitrage and refinancing
- **Yield Optimization** — Auto-compounding interest with sToken receipt mechanism
- **Governance** — On-chain DAO with proposal creation, voting, and time-locked execution

### Platform Features
- **Real-Time Dashboard** — Live portfolio health, earnings, and borrow position tracking
- **Risk Analytics** — Scenario simulation, liquidation price alerts, and portfolio stress testing
- **Multi-Wallet Support** — Freighter, xBull, Albedo, and WalletConnect integrations
- **Price Oracles** — Decentralized price feeds with TWAP (Time-Weighted Average Price) protection
- **Notifications** — Email, SMS, and push notifications for health factor alerts
- **Transaction History** — Full on-chain and off-chain audit trail with export capabilities

---

## 🏛️ Architecture Overview

SoroLend follows a three-tier architecture with on-chain smart contracts, an off-chain indexer and API layer, and a rich frontend client.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                      │
│                        Angular 17 SPA (PWA)                                    │
│   Dashboard │ Lending UI │ Borrowing UI │ Governance │ Analytics │ Admin       │
└───────────────────────────────┬────────────────────────────────────────────────┘
                                │ HTTPS / WebSocket
┌───────────────────────────────▼────────────────────────────────────────────────┐
│                             API GATEWAY (NestJS)                               │
│   REST API │ WebSocket Gateway │ GraphQL │ Auth (JWT/Wallet Sig) │ Rate Limit  │
│                                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Lending     │  │  Borrowing   │  │  Liquidation │  │  Governance      │  │
│  │  Service     │  │  Service     │  │  Engine      │  │  Service         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Oracle      │  │  Indexer     │  │  Notification│  │  Analytics       │  │
│  │  Service     │  │  Service     │  │  Service     │  │  Service         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────┬────────────────┬─────────────────┬──────────────────────────────┘
              │                │                 │
     ┌────────▼──────┐ ┌───────▼──────┐ ┌───────▼──────┐
     │  PostgreSQL   │ │    Redis     │ │   RabbitMQ   │
     │  (Primary DB) │ │ (Cache/Pub) │ │  (Event Bus) │
     └───────────────┘ └──────────────┘ └──────────────┘
              │
┌─────────────▼────────────────────────────────────────────────────────────────┐
│                       STELLAR / SOROBAN LAYER                                 │
│                                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  Lending Pool │  │  Collateral   │  │  Liquidation  │  │  Governance   │  │
│  │  Contract     │  │  Manager      │  │  Contract     │  │  Contract     │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                     │
│  │  Price Oracle │  │  sToken       │  │  Flash Loan   │                     │
│  │  Contract     │  │  Contract     │  │  Contract     │                     │
│  └───────────────┘  └───────────────┘  └───────────────┘                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Smart Contracts
| Component | Technology | Version |
|-----------|------------|---------|
| Platform | Stellar Soroban | Latest |
| Language | Rust | 1.75+ |
| SDK | soroban-sdk | 20.x |
| Testing | soroban-sdk testing | 20.x |
| Oracle | Band Protocol / Pyth | — |

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20 LTS |
| ORM | TypeORM | 0.3.x |
| Database | PostgreSQL | 15.x |
| Cache | Redis | 7.x |
| Message Queue | RabbitMQ | 3.12 |
| API Docs | Swagger / OpenAPI | 3.0 |
| Real-time | Socket.IO | 4.x |
| Validation | class-validator | 0.14.x |
| Auth | Passport.js + JWT | — |
| Scheduling | @nestjs/schedule | 3.x |
| HTTP Client | Axios | 1.x |
| Blockchain SDK | stellar-sdk | 11.x |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Angular | 17.x |
| Language | TypeScript | 5.x |
| State Management | NgRx | 17.x |
| UI Library | Angular Material + Custom DS | 17.x |
| CSS | SCSS + Tailwind CSS | — |
| Charting | Chart.js + D3.js | — |
| Wallet Integration | Freighter API | 2.x |
| HTTP | Angular HttpClient | 17.x |
| Animations | Angular Animations + GSAP | — |
| i18n | Angular i18n | 17.x |
| PWA | @angular/pwa | 17.x |
| Testing | Jest + Cypress | — |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (GKE/EKS) |
| CI/CD | GitHub Actions |
| IaC | Terraform |
| Reverse Proxy | Nginx |
| CDN | Cloudflare |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack (Elasticsearch, Logstash, Kibana) |
| Tracing | OpenTelemetry + Jaeger |
| Secrets | HashiCorp Vault / AWS Secrets Manager |
| Cloud Provider | AWS (primary) / GCP (secondary) |

---

## 📁 Repository Structure

```
sorolend/
├── 📁 contracts/                        # Soroban smart contracts (Rust)
│   ├── lending-pool/                    # Core lending pool contract
│   │   ├── src/
│   │   │   ├── lib.rs                   # Contract entry point
│   │   │   ├── storage.rs               # Storage types and helpers
│   │   │   ├── interest.rs              # Interest rate model
│   │   │   ├── math.rs                  # Fixed-point math utilities
│   │   │   └── events.rs                # Contract events
│   │   ├── Cargo.toml
│   │   └── tests/
│   ├── collateral-manager/              # Collateral management contract
│   ├── liquidation/                     # Liquidation engine contract
│   ├── price-oracle/                    # Oracle aggregator contract
│   ├── stoken/                          # Yield-bearing receipt token (ERC4626-like)
│   ├── governance/                      # DAO governance contract
│   ├── flash-loan/                      # Flash loan contract
│   └── scripts/                         # Deployment & interaction scripts
│
├── 📁 backend/                          # NestJS API server
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/                      # Configuration module
│   │   │   ├── configuration.ts
│   │   │   ├── database.config.ts
│   │   │   └── stellar.config.ts
│   │   ├── modules/
│   │   │   ├── auth/                    # Authentication module
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── wallet.strategy.ts
│   │   │   │   └── guards/
│   │   │   ├── lending/                 # Lending operations module
│   │   │   │   ├── lending.module.ts
│   │   │   │   ├── lending.service.ts
│   │   │   │   ├── lending.controller.ts
│   │   │   │   ├── lending.gateway.ts   # WebSocket gateway
│   │   │   │   └── dto/
│   │   │   ├── borrowing/               # Borrowing operations module
│   │   │   ├── collateral/              # Collateral management module
│   │   │   ├── liquidation/             # Liquidation engine module
│   │   │   ├── oracle/                  # Price oracle aggregation module
│   │   │   ├── indexer/                 # Blockchain event indexer module
│   │   │   ├── governance/              # DAO governance module
│   │   │   ├── notifications/           # Notification service module
│   │   │   ├── analytics/               # Analytics & reporting module
│   │   │   ├── portfolio/               # User portfolio module
│   │   │   └── admin/                   # Admin module
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/                 # Exception filters
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── utils/
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── shared/
│   │       ├── stellar/                 # Stellar SDK wrapper
│   │       ├── redis/                   # Redis service
│   │       └── events/                  # RabbitMQ events
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── 📁 frontend/                         # Angular 17 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.config.ts            # Standalone app configuration
│   │   │   ├── app.routes.ts            # Root routing
│   │   │   ├── core/                    # Core module (singleton services)
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── wallet.service.ts
│   │   │   │   │   ├── stellar.service.ts
│   │   │   │   │   └── notification.service.ts
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   └── store/               # Root NgRx store
│   │   │   ├── features/                # Feature modules (lazy-loaded)
│   │   │   │   ├── dashboard/           # Main dashboard
│   │   │   │   ├── lending/             # Lending interface
│   │   │   │   ├── borrowing/           # Borrowing interface
│   │   │   │   ├── collateral/          # Collateral management
│   │   │   │   ├── liquidation/         # Liquidation interface
│   │   │   │   ├── governance/          # DAO governance
│   │   │   │   ├── analytics/           # Analytics & charts
│   │   │   │   ├── portfolio/           # User portfolio
│   │   │   │   └── settings/            # User settings
│   │   │   ├── shared/                  # Shared components & utilities
│   │   │   │   ├── components/
│   │   │   │   │   ├── token-input/
│   │   │   │   │   ├── health-factor-badge/
│   │   │   │   │   ├── price-ticker/
│   │   │   │   │   ├── tx-status-modal/
│   │   │   │   │   └── wallet-connect/
│   │   │   │   ├── pipes/
│   │   │   │   ├── directives/
│   │   │   │   └── models/
│   │   │   └── layout/                  # Layout components
│   │   │       ├── header/
│   │   │       ├── sidebar/
│   │   │       └── footer/
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── fonts/
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   ├── environment.staging.ts
│   │   │   └── environment.prod.ts
│   │   └── styles/                      # Global SCSS styles
│   │       ├── _variables.scss
│   │       ├── _typography.scss
│   │       ├── _mixins.scss
│   │       └── _themes.scss
│   ├── e2e/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── 📁 infrastructure/                   # Infrastructure as Code
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   ├── rds/
│   │   │   ├── elasticache/
│   │   │   └── cdn/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── main.tf
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── deployments/
│   │   │   ├── backend.yaml
│   │   │   ├── frontend.yaml
│   │   │   ├── indexer.yaml
│   │   │   └── liquidation-bot.yaml
│   │   ├── services/
│   │   ├── ingress/
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   └── hpa/                         # Horizontal Pod Autoscaler
│   ├── monitoring/
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   └── alertmanager/
│   └── docker/
│       └── docker-compose.yml
│
├── 📁 .github/                          # CI/CD pipelines
│   ├── workflows/
│   │   ├── ci.yml                       # Lint, test, build
│   │   ├── cd-staging.yml               # Deploy to staging
│   │   ├── cd-production.yml            # Deploy to production
│   │   ├── contract-audit.yml           # Smart contract security checks
│   │   └── dependency-check.yml
│   └── CODEOWNERS
│
├── 📁 docs/                             # Project documentation
│   ├── architecture/
│   ├── api/
│   ├── contracts/
│   ├── runbooks/
│   └── adr/                             # Architecture Decision Records
│
├── docker-compose.yml                   # Local development stack
├── docker-compose.prod.yml
├── .env.example
├── Makefile                             # Developer convenience commands
└── README.md
```

---

## ⛓️ Smart Contracts (Soroban)

SoroLend's core protocol logic lives entirely on-chain as Soroban smart contracts written in Rust.

### Lending Pool Contract

The central contract managing all supply and borrow operations.

```rust
// contracts/lending-pool/src/lib.rs (simplified interface)

#[contract]
pub struct LendingPool;

#[contractimpl]
impl LendingPool {
    /// Initialize pool with configuration parameters
    pub fn initialize(env: Env, admin: Address, config: PoolConfig) -> Result<(), Error>

    /// Supply assets to earn interest — mints sTokens to supplier
    pub fn supply(env: Env, caller: Address, asset: Address, amount: i128) -> Result<i128, Error>

    /// Withdraw supplied assets (burns sTokens)
    pub fn withdraw(env: Env, caller: Address, asset: Address, amount: i128) -> Result<i128, Error>

    /// Borrow assets against collateral
    pub fn borrow(env: Env, caller: Address, asset: Address, amount: i128) -> Result<(), Error>

    /// Repay borrowed assets
    pub fn repay(env: Env, caller: Address, asset: Address, amount: i128) -> Result<i128, Error>

    /// Get current supply APY for an asset
    pub fn get_supply_apy(env: Env, asset: Address) -> i128

    /// Get current borrow APY for an asset
    pub fn get_borrow_apy(env: Env, asset: Address) -> i128

    /// Accrue interest for all pools (called by keeper)
    pub fn accrue_interest(env: Env) -> Result<(), Error>
}
```

### Collateral Manager Contract

Handles collateral locking, unlocking, and health factor computation.

```rust
#[contractimpl]
impl CollateralManager {
    /// Deposit collateral asset
    pub fn deposit_collateral(env: Env, user: Address, asset: Address, amount: i128) -> Result<(), Error>

    /// Withdraw collateral (only if health factor remains safe)
    pub fn withdraw_collateral(env: Env, user: Address, asset: Address, amount: i128) -> Result<(), Error>

    /// Compute user's health factor (18 decimal precision)
    /// health_factor = (sum(collateral_i * price_i * liq_threshold_i)) / total_borrow_usd
    /// HF < 1.0 => liquidatable
    pub fn get_health_factor(env: Env, user: Address) -> i128

    /// Get user's total collateral value in USD
    pub fn get_collateral_value_usd(env: Env, user: Address) -> i128

    /// Get maximum borrowable amount for user
    pub fn get_available_borrow_usd(env: Env, user: Address) -> i128
}
```

### Interest Rate Model

SoroLend uses a two-slope (kinked) interest rate model:

```
Borrow Rate
    │
    │                           /
    │                          /
    │              ___________/
    │             /   Slope 2
    │            /
    │___________/  Slope 1
    │
    └───────────────────────────── Utilization
                  Kink (80%)     100%

Formula:
  If U ≤ Uoptimal:  R = Rbase + (U / Uoptimal) × Rslope1
  If U > Uoptimal:  R = Rbase + Rslope1 + ((U - Uoptimal) / (1 - Uoptimal)) × Rslope2
```

### Contract Addresses

| Contract | Testnet | Mainnet |
|----------|---------|---------|
| LendingPool | `CBTESTPOOL...` | `CMAINPOOL...` |
| CollateralManager | `CBTESTCOLL...` | `CMAINCOLL...` |
| Liquidation | `CBTESTLIQ...` | `CMAINLIQ...` |
| PriceOracle | `CBTESTORACLE...` | `CMAINORACLE...` |
| Governance | `CBTESTGOV...` | `CMAINGOV...` |

### Deploying Contracts

```bash
# Install Soroban CLI
cargo install --locked soroban-cli --features opt

# Build all contracts
cd contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/lending_pool.wasm \
  --source <DEPLOYER_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Run contract tests
cargo test
```

---

## 🖥️ Backend — NestJS

The backend is a modular NestJS application serving as the protocol's API layer, event indexer, and off-chain computation engine.

### Module Architecture

```
AppModule
├── ConfigModule (global)
├── DatabaseModule (TypeORM + PostgreSQL)
├── CacheModule (Redis)
├── AuthModule
│   ├── JwtStrategy
│   └── WalletSignatureStrategy     ← Sign-in with Stellar (SIWS)
├── LendingModule
│   ├── LendingController            ← REST endpoints
│   ├── LendingService               ← Business logic
│   ├── LendingGateway               ← WebSocket real-time updates
│   └── LendingScheduler             ← Cron: interest accrual sync
├── BorrowingModule
├── CollateralModule
├── LiquidationModule
│   ├── LiquidationService           ← Health factor monitoring
│   ├── LiquidationBot               ← Automated keeper logic
│   └── LiquidationGateway           ← Real-time liquidation events
├── OracleModule
│   ├── OracleAggregatorService      ← Band + Pyth price feeds
│   ├── TwapService                  ← TWAP calculation & manipulation protection
│   └── OracleScheduler              ← Cron: price feed refresh (every 30s)
├── IndexerModule
│   ├── StellarIndexerService        ← Listen & index Soroban events
│   ├── EventProcessorService        ← Process & store events
│   └── IndexerGateway               ← Push events to frontend
├── GovernanceModule
├── NotificationModule
│   ├── EmailService                 ← AWS SES / SendGrid
│   ├── PushService                  ← Web push notifications
│   └── AlertService                 ← Health factor threshold alerts
├── AnalyticsModule
│   ├── TvlService                   ← Total Value Locked computation
│   ├── ApyHistoryService            ← APY time-series data
│   └── ProtocolStatsService         ← Global protocol metrics
└── AdminModule
    ├── AdminController              ← Protected admin APIs
    └── ParameterService             ← Risk parameter management
```

### Authentication — Sign-In With Stellar (SIWS)

SoroLend uses wallet signature authentication — no passwords required.

```typescript
// POST /auth/challenge
// Returns a nonce the user must sign with their Stellar wallet

// POST /auth/verify
// Verifies the wallet signature and issues a JWT

@Injectable()
export class WalletAuthService {
  async generateChallenge(walletAddress: string): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const message = `Sign in to SoroLend\nAddress: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
    await this.redis.set(`auth:nonce:${walletAddress}`, nonce, 'EX', 300);
    return message;
  }

  async verifySignature(walletAddress: string, signature: string): Promise<string> {
    const nonce = await this.redis.get(`auth:nonce:${walletAddress}`);
    if (!nonce) throw new UnauthorizedException('Challenge expired');
    
    const isValid = StellarSdk.verify(message, signature, walletAddress);
    if (!isValid) throw new UnauthorizedException('Invalid signature');
    
    await this.redis.del(`auth:nonce:${walletAddress}`);
    return this.jwtService.sign({ sub: walletAddress });
  }
}
```

### Liquidation Engine

The off-chain liquidation engine continuously monitors user health factors and triggers liquidations via smart contracts when positions become unsafe.

```typescript
@Injectable()
export class LiquidationBotService implements OnModuleInit {

  // Runs every 15 seconds
  @Cron('*/15 * * * * *')
  async scanAndLiquidate(): Promise<void> {
    const atRiskPositions = await this.collateralService
      .findPositionsBelow({ healthFactor: 1.05 }); // 5% buffer

    for (const position of atRiskPositions) {
      if (position.healthFactor < 1.0) {
        await this.executeLiquidation(position);
      } else {
        await this.notificationService.sendLowHealthAlert(position);
      }
    }
  }

  private async executeLiquidation(position: BorrowPosition): Promise<void> {
    // Build Soroban transaction
    const tx = await this.stellarService.buildLiquidationTx({
      borrower: position.userAddress,
      debtAsset: position.debtAsset,
      collateralAsset: position.bestCollateral,
      debtToCover: this.calculateOptimalDebtCover(position),
    });

    const result = await this.stellarService.submitTransaction(tx);
    await this.indexerService.processLiquidationEvent(result);
  }
}
```

### Key REST API Endpoints

```
Authentication
  POST   /api/v1/auth/challenge              Generate wallet sign-in challenge
  POST   /api/v1/auth/verify                 Verify signature & issue JWT
  POST   /api/v1/auth/refresh                Refresh JWT token
  DELETE /api/v1/auth/logout                 Invalidate session

Lending
  GET    /api/v1/markets                     List all lending markets
  GET    /api/v1/markets/:asset              Get market details & APY
  POST   /api/v1/lending/supply              Supply assets to pool
  POST   /api/v1/lending/withdraw            Withdraw supplied assets
  GET    /api/v1/lending/positions/:address  Get user's supply positions

Borrowing
  POST   /api/v1/borrowing/borrow            Borrow assets
  POST   /api/v1/borrowing/repay             Repay borrowed assets
  GET    /api/v1/borrowing/positions/:address Get user borrow positions
  GET    /api/v1/borrowing/health/:address    Get health factor

Collateral
  POST   /api/v1/collateral/deposit          Deposit collateral
  POST   /api/v1/collateral/withdraw         Withdraw collateral
  GET    /api/v1/collateral/portfolio/:addr  Get collateral portfolio
  GET    /api/v1/collateral/max-borrow/:addr Get maximum borrowable amount

Oracle & Prices
  GET    /api/v1/prices                      Get all asset prices
  GET    /api/v1/prices/:asset               Get asset price with TWAP
  GET    /api/v1/prices/:asset/history       Get price history

Analytics
  GET    /api/v1/analytics/tvl               Total Value Locked
  GET    /api/v1/analytics/apy-history       APY time-series data
  GET    /api/v1/analytics/protocol-stats    Protocol-wide statistics
  GET    /api/v1/analytics/user/:address     User analytics & history

Governance
  GET    /api/v1/governance/proposals        List governance proposals
  POST   /api/v1/governance/proposals        Create new proposal
  POST   /api/v1/governance/vote             Cast vote on proposal
  GET    /api/v1/governance/voting-power     Get user's voting power
```

### WebSocket Events

```typescript
// Client connects via: ws://api.sorolend.finance/socket.io

// Subscribe to real-time market updates
socket.emit('subscribe:market', { asset: 'XLM' });
socket.on('market:update', (data: MarketUpdate) => { /* APY, utilization */ });

// Subscribe to position health updates
socket.emit('subscribe:position', { address: '0x...' });
socket.on('position:health', (data: HealthUpdate) => { /* health factor */ });

// Subscribe to liquidation events
socket.emit('subscribe:liquidations');
socket.on('liquidation:executed', (data: LiquidationEvent) => { /* liquidation details */ });

// Subscribe to price feed
socket.emit('subscribe:prices');
socket.on('price:update', (data: PriceUpdate) => { /* latest prices */ });
```

### Running the Backend

```bash
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Seed initial data (development)
npm run seed

# Start in development mode (with hot reload)
npm run start:dev

# Start in production mode
npm run start:prod

# Run tests
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Coverage report
```

---

## 🖥️ Frontend — Angular

The SoroLend frontend is a feature-rich Angular 17 Progressive Web App (PWA) delivering a seamless DeFi user experience.

### State Management (NgRx)

```
Store
├── auth/
│   ├── walletAddress: string | null
│   ├── isConnected: boolean
│   └── jwtToken: string | null
├── markets/
│   ├── markets: Market[]
│   ├── selectedMarket: Market | null
│   └── loading/error states
├── portfolio/
│   ├── supplyPositions: SupplyPosition[]
│   ├── borrowPositions: BorrowPosition[]
│   ├── collateral: CollateralAsset[]
│   ├── healthFactor: number
│   └── netApy: number
├── prices/
│   ├── prices: Record<string, PriceFeed>
│   └── lastUpdated: Date
└── governance/
    ├── proposals: Proposal[]
    └── votingPower: number
```

### Key Angular Features Used

```typescript
// Standalone components (Angular 17)
@Component({
  selector: 'sl-health-factor-badge',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  template: `
    <div class="health-badge" [class]="healthClass">
      <span class="value">{{ healthFactor | number:'1.2-2' }}</span>
      <span class="label">Health Factor</span>
      <mat-icon [matTooltip]="healthTooltip">info</mat-icon>
    </div>
  `
})
export class HealthFactorBadgeComponent {
  @Input() healthFactor!: number;

  get healthClass(): string {
    if (this.healthFactor >= 2.0) return 'safe';
    if (this.healthFactor >= 1.3) return 'moderate';
    if (this.healthFactor >= 1.1) return 'warning';
    return 'danger';
  }
}
```

```typescript
// Signal-based reactivity (Angular 17)
@Component({ ... })
export class DashboardComponent {
  private portfolioService = inject(PortfolioService);

  healthFactor = this.portfolioService.healthFactor;     // signal
  supplyApy = this.portfolioService.netSupplyApy;         // computed signal
  borrowApy = this.portfolioService.netBorrowApy;         // computed signal

  liquidationPrice = computed(() =>
    this.portfolioService.computeLiquidationPrice(
      this.healthFactor(),
      this.portfolioService.totalCollateral()
    )
  );
}
```

### Wallet Integration

```typescript
@Injectable({ providedIn: 'root' })
export class WalletService {

  async connectFreighter(): Promise<string> {
    if (!window.freighter) throw new Error('Freighter wallet not installed');

    await window.freighter.connect();
    const { address } = await window.freighter.getAddress();
    return address;
  }

  async signTransaction(xdr: string): Promise<string> {
    const { signedTxXdr } = await window.freighter.signTransaction(xdr, {
      networkPassphrase: this.config.networkPassphrase,
    });
    return signedTxXdr;
  }

  async signMessage(message: string): Promise<string> {
    const { signature } = await window.freighter.signMessage(message);
    return signature;
  }
}
```

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve                           # http://localhost:4200

# Start with staging API
ng serve --configuration=staging

# Build for production
ng build --configuration=production

# Run unit tests
ng test

# Run e2e tests
npx cypress run

# Analyze bundle size
ng build --stats-json && npx webpack-bundle-analyzer dist/stats.json
```

---

## 🏗️ Infrastructure & DevOps

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sorolend
      POSTGRES_USER: sorolend
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sorolend"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: sorolend
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"     # Management UI

  backend:
    build:
      context: ./backend
      target: development
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://sorolend:${DB_PASSWORD}@postgres:5432/sorolend
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    volumes:
      - ./backend/src:/app/src
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build:
      context: ./frontend
      target: development
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "4200:4200"
    environment:
      - API_URL=http://backend:3000

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# infrastructure/kubernetes/deployments/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sorolend-backend
  namespace: sorolend-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: sorolend-backend
  template:
    metadata:
      labels:
        app: sorolend-backend
    spec:
      containers:
        - name: backend
          image: ghcr.io/sorolend/backend:${IMAGE_TAG}
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          envFrom:
            - secretRef:
                name: sorolend-backend-secrets
            - configMapRef:
                name: sorolend-backend-config
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          target: wasm32-unknown-unknown
      - run: cd contracts && cargo test
      - run: cd contracts && cargo clippy -- -D warnings

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm run test:cov

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run test:ci
      - run: cd frontend && npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
```

---

## 🗄️ Database Design

### Core Entities

```sql
-- Users / Wallets
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  VARCHAR(56) UNIQUE NOT NULL,   -- Stellar G-address
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  notification_preferences JSONB DEFAULT '{}'
);

-- Asset registry
CREATE TABLE assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol                VARCHAR(12) UNIQUE NOT NULL,   -- "XLM", "USDC"
  contract_address      VARCHAR(56) NOT NULL,
  ltv_ratio             NUMERIC(5,4) NOT NULL,          -- e.g. 0.7500 (75%)
  liquidation_threshold NUMERIC(5,4) NOT NULL,          -- e.g. 0.8000 (80%)
  liquidation_penalty   NUMERIC(5,4) NOT NULL,          -- e.g. 0.0500 (5%)
  reserve_factor        NUMERIC(5,4) NOT NULL,
  is_active             BOOLEAN DEFAULT true,
  decimals              INT NOT NULL DEFAULT 7
);

-- Supply positions
CREATE TABLE supply_positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  asset_id        UUID REFERENCES assets(id),
  stoken_balance  NUMERIC(38,18) NOT NULL DEFAULT 0,   -- yield-bearing receipt
  principal       NUMERIC(38,18) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

-- Borrow positions
CREATE TABLE borrow_positions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  asset_id            UUID REFERENCES assets(id),
  principal           NUMERIC(38,18) NOT NULL DEFAULT 0,
  accrued_interest    NUMERIC(38,18) NOT NULL DEFAULT 0,
  interest_index      NUMERIC(38,18) NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

-- Collateral positions
CREATE TABLE collateral_positions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  asset_id    UUID REFERENCES assets(id),
  amount      NUMERIC(38,18) NOT NULL DEFAULT 0,
  UNIQUE(user_id, asset_id)
);

-- Market snapshots (time-series for APY charts)
CREATE TABLE market_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID REFERENCES assets(id),
  supply_rate     NUMERIC(20,18) NOT NULL,
  borrow_rate     NUMERIC(20,18) NOT NULL,
  utilization     NUMERIC(10,9) NOT NULL,
  total_supply    NUMERIC(38,18) NOT NULL,
  total_borrow    NUMERIC(38,18) NOT NULL,
  snapshot_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_market_snapshots_asset_time ON market_snapshots(asset_id, snapshot_at DESC);

-- Liquidations
CREATE TABLE liquidation_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id       UUID REFERENCES users(id),
  liquidator_id     UUID REFERENCES users(id),
  debt_asset_id     UUID REFERENCES assets(id),
  collateral_asset_id UUID REFERENCES assets(id),
  debt_covered      NUMERIC(38,18) NOT NULL,
  collateral_seized NUMERIC(38,18) NOT NULL,
  bonus_received    NUMERIC(38,18) NOT NULL,
  tx_hash           VARCHAR(64) NOT NULL,
  executed_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Price oracle history
CREATE TABLE price_feeds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID REFERENCES assets(id),
  price_usd   NUMERIC(28,8) NOT NULL,
  source      VARCHAR(32) NOT NULL,   -- 'band', 'pyth', 'twap'
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_price_feeds_asset_time ON price_feeds(asset_id, recorded_at DESC);
```

---

## 🔐 Security

### Smart Contract Security

- **Formal Verification** — Critical math functions formally verified
- **Re-entrancy Protection** — Check-effects-interactions pattern enforced
- **Access Control** — Role-based permissions (admin, keeper, user)
- **Overflow Protection** — Rust's built-in integer overflow detection
- **Oracle Manipulation Protection** — TWAP pricing with deviation thresholds
- **Flash Loan Attack Mitigation** — Single-transaction collateral checks

### Backend Security

- **Authentication** — Wallet signature-based auth (no passwords)
- **JWT Security** — Short-lived tokens (15 min) with refresh rotation
- **Rate Limiting** — Per-endpoint rate limits via `@nestjs/throttler`
- **Input Validation** — `class-validator` on all DTOs
- **SQL Injection** — Parameterized queries via TypeORM
- **CORS** — Allowlist-based CORS configuration
- **Helmet.js** — HTTP security headers
- **Secrets Management** — HashiCorp Vault for all credentials
- **Dependency Scanning** — Automated Snyk + Dependabot checks

### Frontend Security

- **Content Security Policy** — Strict CSP headers
- **XSS Prevention** — Angular's built-in sanitization + DOMPurify
- **Subresource Integrity** — SRI hashes on all CDN resources
- **Secure Cookies** — HttpOnly + SameSite + Secure flags
- **Private Key Handling** — Keys NEVER leave the user's wallet extension

### Infrastructure Security

- **Network Isolation** — VPC with private subnets for all internal services
- **WAF** — Cloudflare WAF rules for API protection
- **mTLS** — Mutual TLS between internal microservices
- **Secrets Rotation** — Automated secret rotation every 30 days
- **Container Scanning** — Trivy image scanning in CI/CD
- **Penetration Testing** — Quarterly third-party pen tests

---

## 🚀 Getting Started

### Prerequisites

Ensure you have these tools installed:

```bash
# Node.js (via nvm recommended)
nvm install 20
nvm use 20
node --version   # v20.x.x

# Rust (for smart contracts)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Soroban CLI
cargo install --locked soroban-cli --features opt

# Docker & Docker Compose
docker --version         # 24.x+
docker compose version   # 2.x+

# Angular CLI
npm install -g @angular/cli@17
```

### Quick Start (Full Stack)

```bash
# 1. Clone the repository
git clone https://github.com/sorolend/sorolend.git
cd sorolend

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services with Docker Compose
make dev
# or:
docker compose up -d

# 4. Run database migrations
make migrate
# or:
docker compose exec backend npm run migration:run

# 5. Seed development data
make seed

# 6. Open the application
open http://localhost:4200
# API docs available at: http://localhost:3000/api/docs
```

### Running Services Individually

```bash
# Backend only
cd backend
npm install
npm run start:dev        # starts on :3000

# Frontend only
cd frontend
npm install
ng serve                 # starts on :4200

# Smart contracts (test)
cd contracts
cargo test
```

### Connecting a Wallet (Testnet)

1. Install the [Freighter wallet extension](https://freighter.app)
2. Switch to **Stellar Testnet** in Freighter settings
3. Fund your testnet account via [Friendbot](https://friendbot.stellar.org)
4. Visit `http://localhost:4200` and click **Connect Wallet**
5. Sign the authentication challenge in Freighter

---

## ⚙️ Environment Variables

### Backend `.env`

```dotenv
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=sorolend
DATABASE_USER=sorolend
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# RabbitMQ
RABBITMQ_URL=amqp://sorolend:password@localhost:5672

# JWT
JWT_SECRET=your_super_long_jwt_secret_minimum_32_chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stellar / Soroban
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_KEEPER_SECRET_KEY=S...           # Keeper wallet for liquidation bot

# Contract Addresses
CONTRACT_LENDING_POOL=CBTESTPOOL...
CONTRACT_COLLATERAL_MANAGER=CBTESTCOLL...
CONTRACT_LIQUIDATION=CBTESTLIQ...
CONTRACT_ORACLE=CBTESTORACLE...

# Oracle
BAND_API_URL=https://laozi-testnet6.bandchain.org/api
PYTH_ENDPOINT=https://hermes-beta.pyth.network
ORACLE_REFRESH_INTERVAL_SEC=30

# Notifications
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=noreply@sorolend.finance
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Logging
LOG_LEVEL=debug
```

### Frontend `environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3000',
  stellar: {
    network: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanUrl: 'https://soroban-testnet.stellar.org',
  },
  contracts: {
    lendingPool: 'CBTESTPOOL...',
    collateralManager: 'CBTESTCOLL...',
  },
  features: {
    flashLoans: true,
    governance: true,
    analytics: true,
  }
};
```

---

## 📖 API Reference

SoroLend exposes a comprehensive REST API documented via Swagger/OpenAPI.

**Interactive Docs:** `https://api.sorolend.finance/docs`

### Authentication

All protected endpoints require a Bearer JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Example Requests

```bash
# Get all lending markets
curl https://api.sorolend.finance/api/v1/markets

# Get health factor for a wallet
curl -H "Authorization: Bearer <token>" \
     https://api.sorolend.finance/api/v1/borrowing/health/GABCDEF...

# Supply XLM to the lending pool
curl -X POST https://api.sorolend.finance/api/v1/lending/supply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "XLM",
    "amount": "100.0000000",
    "walletAddress": "GABCDEF..."
  }'

# Response: Returns unsigned Soroban XDR transaction for the wallet to sign
# {
#   "txXdr": "AAAAAgAAAA...",
#   "networkPassphrase": "Test SDF Network ; September 2015",
#   "fee": "100"
# }
```

---

## 🧪 Testing

### Smart Contract Tests (Rust)

```bash
cd contracts
cargo test                          # Run all tests
cargo test -- --nocapture           # Show println! output
cargo test lending_pool             # Run specific module tests
```

### Backend Tests (Jest)

```bash
cd backend
npm run test                        # Unit tests
npm run test:watch                  # Watch mode
npm run test:e2e                    # End-to-end tests
npm run test:cov                    # Coverage report (target: >80%)
```

### Frontend Tests (Jest + Cypress)

```bash
cd frontend
ng test                             # Unit tests (Karma/Jest)
ng test --watch=false --code-coverage

# E2E tests with Cypress
npx cypress open                    # Interactive mode
npx cypress run                     # Headless mode
npx cypress run --spec "e2e/lending.cy.ts"
```

### Test Coverage Targets

| Layer | Target |
|-------|--------|
| Smart Contracts | 95%+ |
| Backend (Unit) | 80%+ |
| Backend (Integration) | 70%+ |
| Frontend (Unit) | 75%+ |
| Frontend (E2E critical paths) | 100% |

---

## 📦 Deployment

### Staging

```bash
# Triggered automatically on merge to `develop` branch
# or manually:
make deploy-staging
```

### Production

```bash
# Requires manual approval in GitHub Actions
# Triggered on merge to `main` branch

# Manual deployment:
make deploy-prod

# Rollback if needed:
kubectl rollout undo deployment/sorolend-backend -n sorolend-prod
kubectl rollout undo deployment/sorolend-frontend -n sorolend-prod
```

### Smart Contract Upgrades

```bash
# SoroLend uses upgradeability pattern via proxy contracts
# Upgrades require governance approval (time-lock)

# 1. Submit upgrade proposal
soroban contract invoke --id $GOVERNANCE_CONTRACT \
  -- propose_upgrade \
  --new_wasm_hash <NEW_WASM_HASH> \
  --description "Upgrade lending pool v1.2"

# 2. Community votes (48h voting period)
# 3. Time-lock expires (24h)
# 4. Execute upgrade
soroban contract invoke --id $GOVERNANCE_CONTRACT -- execute_upgrade
```

---

## 📊 Monitoring & Observability

### Metrics (Prometheus + Grafana)

Key metrics tracked:

```
# Protocol metrics
sorolend_tvl_usd                    - Total Value Locked
sorolend_total_borrowed_usd         - Total protocol borrows
sorolend_utilization_rate{asset}    - Per-asset utilization
sorolend_liquidations_total         - Liquidation count

# API metrics
http_request_duration_seconds       - Request latency
http_requests_total                 - Request throughput
sorolend_ws_connections_active      - Active WebSocket connections

# Liquidation bot metrics
sorolend_positions_monitored        - Positions under watch
sorolend_positions_at_risk          - Positions with HF < 1.1
sorolend_liquidation_bot_latency    - Time from detection to execution
```

**Grafana Dashboards:** `https://grafana.sorolend.finance`

### Logging (ELK Stack)

Structured JSON logs are shipped to Elasticsearch via Logstash:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "sorolend-backend",
  "module": "LiquidationService",
  "message": "Liquidation executed",
  "borrower": "GABCDEF...",
  "debtCovered": "1000.0000000",
  "collateralSeized": "1530.0000000",
  "txHash": "abc123...",
  "durationMs": 234
}
```

### Alerting

Critical alerts routed to PagerDuty:

- Health factor scanner down > 60 seconds
- Oracle price feed stale > 5 minutes
- Liquidation bot failure
- API error rate > 1%
- Database connection pool exhausted

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Development Workflow

```bash
# 1. Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/sorolend.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
make test

# 4. Lint and format
make lint

# 5. Commit (conventional commits required)
git commit -m "feat(lending): add flash loan support"

# 6. Push and open PR
git push origin feature/your-feature-name
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new feature
fix(scope): fix a bug
docs(scope): update documentation
test(scope): add or update tests
refactor(scope): code refactoring
chore(scope): tooling, dependencies
```

---

## 🔍 Audits & Compliance

| Audit | Firm | Date | Status |
|-------|------|------|--------|
| Smart Contract Audit | Trail of Bits | Q1 2024 | ✅ Complete |
| Smart Contract Audit | Certik | Q2 2024 | ✅ Complete |
| Penetration Test | NCC Group | Q2 2024 | ✅ Complete |
| Economic Audit | Gauntlet | Q3 2024 | ✅ Complete |

Audit reports are available in [`/docs/audits/`](docs/audits/).

### Bug Bounty

SoroLend runs an active bug bounty program via [Immunefi](https://immunefi.com/bounty/sorolend):

| Severity | Reward |
|----------|--------|
| Critical | Up to $100,000 |
| High | Up to $30,000 |
| Medium | Up to $5,000 |
| Low | Up to $1,000 |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ on Stellar Soroban**

[Website](https://sorolend.finance) · [Twitter](https://twitter.com/sorolend) · [Discord](https://discord.gg/sorolend) · [Telegram](https://t.me/sorolend) · [Docs](https://docs.sorolend.finance)

© 2026 SoroLend Protocol. All rights reserved.

</div>
