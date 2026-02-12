from bot.client import BinanceClientWrapper
from bot.validators import validate_symbol, validate_positive_float, validate_side, validate_order_type
import logging

logger = logging.getLogger("trading_bot")

class OrderManager:
    def __init__(self, client: BinanceClientWrapper):
        self.client = client

    def execute_order(self, symbol: str, side: str, order_type: str, quantity: float, price: float = None):
        """
        Validates input and executes the order via the client.
        """
        try:
            # Validation
            symbol = validate_symbol(symbol)
            side = validate_side(side)
            order_type = validate_order_type(order_type)
            quantity = validate_positive_float(quantity, "Quantity")
            if order_type == "LIMIT":
                price = validate_positive_float(price, "Price")
            
            # Execute
            response = self.client.place_order(symbol, side, order_type, quantity, price)
            return response
        except ValueError as e:
            logger.error(f"Validation Error: {e}")
            raise
        except Exception as e:
            # Client errors already logged
            raise
