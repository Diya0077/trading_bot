import argparse

from bot.client import BinanceFuturesClient
from bot.orders import OrderService
from bot.validators import validate
from bot.logging_config import setup_logging

setup_logging()

MIN_NOTIONAL = 100  # Binance Futures minimum

def main():
    parser = argparse.ArgumentParser(description="Binance Futures Testnet Trading Bot")

    parser.add_argument("--symbol", required=True)
    parser.add_argument("--side", required=True)
    parser.add_argument("--type", required=True)
    parser.add_argument("--quantity", type=float, required=True)
    parser.add_argument("--price", type=float)

    args = parser.parse_args()

    validate(args.side, args.type, args.quantity, args.price)

    client = BinanceFuturesClient()
    service = OrderService(client)

    print("\nChecking minimum notional requirement...")

    current_price = client.get_price(args.symbol)

    # For MARKET use current price
    if args.type == "MARKET":
        notional = args.quantity * current_price
    else:
        notional = args.quantity * args.price

    # Auto-adjust quantity if needed
    if notional < MIN_NOTIONAL:
        required_qty = round((MIN_NOTIONAL / current_price) + 0.001, 3)
        print(f"⚠ Quantity too small for Binance minimum.")
        print(f"Auto-adjusting quantity from {args.quantity} → {required_qty}")
        args.quantity = required_qty

    print("\nFinal Order Details")
    print(f"Symbol: {args.symbol}")
    print(f"Side: {args.side}")
    print(f"Type: {args.type}")
    print(f"Quantity: {args.quantity}")
    if args.type == "LIMIT":
        print(f"Price: {args.price}")

    # Place order
    if args.type == "MARKET":
        result = service.market(args.symbol, args.side, args.quantity)
    else:
        result = service.limit(args.symbol, args.side, args.quantity, args.price)

    print("\nOrder Response")

    if result.get("error"):
        print(" Order Failed")
        print(f"Error Code: {result.get('code')}")
        print(f"Message: {result.get('message')}")
    else:
        order_id = result["orderId"]

        # Fetch updated order details
        updated = client.get_order(args.symbol, order_id)

        print(f"Order ID: {updated['orderId']}")
        print(f"Status: {updated['status']}")
        print(f"Executed Qty: {updated['executedQty']}")
        print(f"Avg Price: {updated['avgPrice']}")
        print("\n Order placed successfully")


if __name__ == "__main__":
    main()
