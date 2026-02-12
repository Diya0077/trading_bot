## Trading Bot – Backend (Flask) + Frontend (React + TypeScript)

This project is a small Binance Futures **testnet** trading bot, with:

- **Backend**: Python + Flask, wrapping the official `python-binance` client.
- **Frontend**: React + TypeScript + Vite, providing a modern dashboard UI.

### 1. Backend – Flask API

**Location**: `backend/`

- Main entry: `app.py`
- CLI helper: `cli.py`
- Core modules:
  - `bot/client.py` – wraps the Binance futures client
  - `bot/orders.py` – order service helpers
  - `bot/validators.py` – input validation
  - `bot/logging_config.py` – file + console logging

#### Environment variables

Binance credentials are **not hard-coded**. Set these before running:

- `BINANCE_API_KEY`
- `BINANCE_API_SECRET`
- Optional: `FLASK_DEBUG=true` to enable debug mode in development.

On Windows PowerShell, for example:

```powershell
$env:BINANCE_API_KEY = "your_testnet_key"
$env:BINANCE_API_SECRET = "your_testnet_secret"
```

#### Key endpoints (all JSON)

- `GET /health` – simple health check.
- `GET /price/<symbol>` – current futures price, e.g. `/price/BTCUSDT`.
- `POST /order`
  - Body:
    - `symbol`: string, e.g. `"BTCUSDT"`
    - `side`: `"BUY"` | `"SELL"`
    - `type`: `"MARKET"` | `"LIMIT"`
    - `quantity`: number
    - `price`: number (required for `LIMIT`, ignored for `MARKET`)
- `GET /orders?symbol=BTCUSDT` – last 10 futures orders for a symbol.

Validation errors and Binance API errors are returned as JSON with HTTP `400`.

#### Run backend

From `backend/`:

```bash
python app.py
```

By default it listens on `http://localhost:5000`.

### 2. Frontend – React + TypeScript (Vite)

**Location**: `frontend/`

- Entry: `src/main.tsx`
- App UI: `src/App.tsx`
- API client: `src/api.ts`

The UI shows:

- Current price for a symbol.
- New order form (side, type, quantity, optional limit price).
- Recent orders table (pulled from the Flask backend).

#### Dev server & proxy to Flask

Vite is configured to **proxy** API calls to the Flask backend:

- Frontend calls `"/api/..."`.
- Vite proxies to `http://localhost:5000` and strips the `/api` prefix.

Run from `frontend/`:

```bash
npm install
npm run dev
```

Then open the printed URL (usually `http://localhost:5173`).

### 3. Typical workflow

1. Set `BINANCE_API_KEY` and `BINANCE_API_SECRET` for **Binance Futures testnet**.
2. Start the backend:
   - `cd backend`
   - `python app.py`
3. Start the frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open the frontend in the browser, select a symbol (e.g. `BTCUSDT`), and place testnet orders.

> **Important**: This is for educational/testing purposes only. Use **testnet** API keys and do not trade real funds with this setup.

