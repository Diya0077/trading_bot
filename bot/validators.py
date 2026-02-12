from typing import Optional

def validate_symbol(symbol: str) -> str:
    if not symbol.isalnum():
        raise ValueError("Symbol must be alphanumeric.")
    return symbol.upper()

def validate_positive_float(value: float, field_name: str) -> float:
    if value <= 0:
        raise ValueError(f"{field_name} must be greater than 0.")
    return value

def validate_side(side: str) -> str:
    side = side.upper()
    if side not in ["BUY", "SELL"]:
        raise ValueError("Side must be either BUY or SELL.")
    return side

def validate_order_type(order_type: str) -> str:
    order_type = order_type.upper()
    valid_types = ["MARKET", "LIMIT", "STOP", "TAKE_PROFIT"] # Basic + Bonus
    if order_type not in valid_types:
        raise ValueError(f"Order type must be one of {valid_types}.")
    return order_type
