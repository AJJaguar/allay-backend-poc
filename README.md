## Transport Inventory Backend

Node.js + TypeScript backend proof of concept exposing a GraphQL API for managing **organizations**, **members**, and **transport assets** (e.g. tricycles, motorcycles). Built with **Express**, **Apollo Server**, **Prisma**, and **PostgreSQL**, with JWT auth, optional OTP login, encrypted member data, and audit logging.

---

## Stack

- **Runtime**: Node.js (TypeScript)
- **API**: GraphQL on Express
- **ORM / DB**: Prisma + PostgreSQL
- **Auth / Security**: JWT, bcrypt, crypto‑js, helmet, cors, express‑rate‑limit

GraphQL endpoint: `http://localhost:<PORT>/graphql` (default `PORT` is `8080`).

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` from the example:

```bash
cp .env.example .env
```

Update at least:

- **`DATABASE_URL`** – PostgreSQL connection string.
- **`JWT_SECRET`** – secret for signing JWTs.
- **`ENCRYPTION_KEY`** – key for encrypting sensitive member data.
- **`CORS_ORIGIN`** – allowed frontend origin (e.g. `http://localhost:3000`).

### 3. Set up the database

```bash
npx prisma migrate dev
```

or:

```bash
npm run prisma:migrate
```

---

## Run

### Development

```bash
npm run dev
```

Server runs on `http://localhost:8080/graphql` by default (see `PORT` in `.env`).

### Production

```bash
npm run build
npm start
```

---

## API (High Level)

See `src/schema/typeDefs.ts` for full schema. At a glance:

- **Queries**:
  - `me`, `dashboardStats`
  - `members`, `member`, `memberByMemberId`
  - `assets`, `asset`, `assetByKarotaNumber`
- **Mutations**:
  - Auth: `login`, `verifyOTP`
  - Password: `requestPasswordReset`, `resetPassword`, `changePassword`
  - Members: `createMember`, `updateMember`, `deleteMember`
  - Assets: `createAsset`, `updateAsset`, `deleteAsset`

All authenticated operations are scoped to the user’s organization via the GraphQL context (`src/middleware/context.ts`).


