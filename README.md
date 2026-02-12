# Binance Futures Testnet Trading Bot

A simplified CLI trading bot for Binance Futures Testnet (USDT-M).

## Features
- Place Market and Limit orders (BUY/SELL)
- Interactive CLI with validation and beautiful output
- Account information display
- Comprehensive logging

## Setup

1. **Prerequisites**: Python 3.9+
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Environment Configuration**:
   - Copy `.env.example` to `.env`
   - Fill in your Binance Testnet API credentials
   ```bash
   cp .env.example .env
   # Edit .env
   ```

## Usage

Run the bot using `main.py`:

```bash
# Place an order (interactive mode)
python main.py trade

# Or with arguments
python main.py trade --symbol BTCUSDT --side BUY --order-type MARKET --quantity 0.02

# Account Info
python main.py info
```

## Docker Usage

The app is containerized as the `tradebot` executable.

1. **Build the image**:
   ```bash
   docker build -t tradebot .
   ```

2. **Run commands**:
   ```bash
   # Interactive Mode
   docker run --rm -it --env-file .env tradebot trade

   # One-off command
   docker run --rm -it --env-file .env tradebot info
   ```

3. **(Optional) Helper Alias (PowerShell)**:
   Create a shortcut to run it like a native app:
   ```powershell
   function tradebot { docker run --rm -it --env-file "$PWD\.env" tradebot $args }
   
   # Now just use:
   tradebot info
   ```
