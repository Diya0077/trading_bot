import os
from binance.client import Client
from binance.exceptions import BinanceAPIException, BinanceRequestException
from bot.logging_config import setup_logging
from dotenv import load_dotenv

logger = setup_logging()

class BinanceClientWrapper:
    def __init__(self, api_key: str = None, api_secret: str = None, testnet: bool = True):
        load_dotenv()
        self.api_key = api_key or os.getenv("BINANCE_TESTNET_API_KEY")
        self.api_secret = api_secret or os.getenv("BINANCE_TESTNET_API_SECRET")
        self.testnet = testnet

        if not self.api_key or not self.api_secret:
            logger.error("API Credentials missing.")
            raise ValueError("API Key and Secret must be provided in env or arguments.")

        try:
            self.client = Client(self.api_key, self.api_secret, testnet=self.testnet)
            logger.info("Binance Client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Binance Client: {e}")
            raise

    def get_account_info(self):
        try:
            logger.info("Fetching account information...")
            info = self.client.futures_account()
            logger.info("Account info fetched successfully.")
            return info
        except BinanceAPIException as e:
            logger.error(f"Binance API Exception: {e}")
            raise
        except BinanceRequestException as e:
            logger.error(f"Binance Request Exception: {e}")
            raise

    def place_order(self, symbol: str, side: str, type: str, quantity: float, price: float = None, timeInForce: str = "GTC"):
        try:
            logger.info(f"Placing order: {side} {quantity} {symbol} @ {type} {price if price else 'Market'}")
            
            params = {
                'symbol': symbol,
                'side': side,
                'type': type,
                'quantity': quantity,
            }

            if type == 'LIMIT':
                if not price:
                    raise ValueError("Price is required for LIMIT orders.")
                params['timeInForce'] = timeInForce
                params['price'] = price
            
            # Additional params for testnet if needed, usually handled by library
            order = self.client.futures_create_order(**params)
            
            logger.info(f"Order placed successfully: {order.get('orderId')}")
            return order

        except BinanceAPIException as e:
            logger.error(f"Order placement failed (API): {e}")
            raise
        except BinanceRequestException as e:
            logger.error(f"Order placement failed (Request): {e}")
            raise
        except Exception as e:
            logger.error(f"Order placement failed (Unknown): {e}")
            raise
