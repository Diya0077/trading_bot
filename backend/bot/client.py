import logging
import os

from binance.client import Client
from binance.exceptions import BinanceAPIException
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()


class BinanceFuturesClient:
    """
    Thin wrapper around the Binance futures client.

    API credentials are loaded from environment variables (or a `.env` file):
    - BINANCE_API_KEY
    - BINANCE_API_SECRET
    """

    def __init__(self):
        api_key = os.getenv("BINANCE_API_KEY")
        api_secret = os.getenv("BINANCE_API_SECRET")

        if not api_key or not api_secret:
            logger.error(
                "Binance API credentials are not set. "
                "Please configure BINANCE_API_KEY and BINANCE_API_SECRET environment variables."
            )
            raise RuntimeError("Binance API credentials not configured")

        self.client = Client(api_key, api_secret, testnet=True)

    def get_price(self, symbol):
        ticker = self.client.futures_symbol_ticker(symbol=symbol)
        return float(ticker["price"])

    def create_order(self, **kwargs):
        try:
            logger.info("API Request: %s", kwargs)
            response = self.client.futures_create_order(**kwargs)
            logger.info("API Response: %s", response)
            return response
        except BinanceAPIException as e:
            logger.error("Binance API Error: %s", e.message)
            return {"error": True, "code": e.code, "message": e.message}

    def get_order(self, symbol, order_id):
        return self.client.futures_get_order(
            symbol=symbol,
            orderId=order_id,
        )

    def get_recent_orders(self, symbol, limit=10):
        """Return the most recent futures orders for a symbol."""
        orders = self.client.futures_get_all_orders(symbol=symbol)
        if limit <= 0:
            return orders
        return orders[-limit:]
