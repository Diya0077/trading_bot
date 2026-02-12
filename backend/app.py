import logging
import os

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from bot.client import BinanceFuturesClient
from bot.logging_config import setup_logging
from bot.orders import OrderService
from bot.validators import validate

setup_logging()
logger = logging.getLogger(__name__)

app = Flask(__name__)

client = BinanceFuturesClient()
service = OrderService(client)


# 🔹 Health check
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# 🔹 Get Price
@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):
    symbol = symbol.upper()
    price = client.get_price(symbol)
    return jsonify({"symbol": symbol, "price": price})


# 🔹 Place Order
@app.route("/order", methods=["POST"])
def place_order():
    data = request.get_json(silent=True) or {}

    try:
        symbol = str(data["symbol"]).upper()
        side = str(data["side"]).upper()
        order_type = str(data["type"]).upper()
        quantity = float(data["quantity"])
        price = float(data["price"]) if data.get("price") is not None else None
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Invalid or missing order fields") from exc

    validate(side, order_type, quantity, price)

    if order_type == "MARKET":
        result = service.market(symbol, side, quantity)
    else:
        result = service.limit(symbol, side, quantity, price)

    # Return appropriate HTTP code on Binance error
    if isinstance(result, dict) and result.get("error"):
        return jsonify(result), 400

    return jsonify(result)


# 🔹 Order History
@app.route("/orders", methods=["GET"])
def order_history():
    symbol = request.args.get("symbol", "BTCUSDT").upper()
    orders = client.get_recent_orders(symbol=symbol, limit=10)
    return jsonify(orders)


@app.errorhandler(ValueError)
def handle_value_error(err: ValueError):
    return (
        jsonify(
            {
                "error": "validation_error",
                "message": str(err),
            }
        ),
        400,
    )


@app.errorhandler(Exception)
def handle_unexpected_error(err: Exception):
    if isinstance(err, HTTPException):
        # Let Flask handle standard HTTPException codes
        return err

    logger.exception("Unexpected server error: %s", err)
    return (
        jsonify(
            {
                "error": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later.",
            }
        ),
        500,
    )


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug)
