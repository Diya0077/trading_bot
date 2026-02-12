class OrderService:
    def __init__(self, client):
        self.client = client

    def market(self, symbol, side, quantity):
        return self.client.create_order(
            symbol=symbol,
            side=side,
            type="MARKET",
            quantity=quantity
        )

    def limit(self, symbol, side, quantity, price):
        return self.client.create_order(
            symbol=symbol,
            side=side,
            type="LIMIT",
            quantity=quantity,
            price=price,
            timeInForce="GTC"
        )
