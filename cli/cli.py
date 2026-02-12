import typer
import sys
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
import pyfiglet
from bot import BinanceClientWrapper, OrderManager, setup_logging

# Initialize Logging
setup_logging()

app = typer.Typer(help="Binance Futures Testnet Trading Bot CLI")
console = Console()

def print_banner():
    """Prints the application banner."""
    ascii_banner = pyfiglet.figlet_format("TradeBot")
    console.print(Text(ascii_banner, style="cyan"))
    console.print(Panel.fit("Binance Futures Testnet CLI", style="bold magenta"))

@app.command()
def trade(
    symbol: str = typer.Option(..., prompt=True, help="Trading Pair Symbol (e.g., BTCUSDT)"),
    side: str = typer.Option(..., prompt=True, help="Order Side (BUY/SELL)"),
    order_type: str = typer.Option(..., prompt=True, help="Order Type (MARKET/LIMIT)"),
    quantity: float = typer.Option(..., prompt=True, help="Quantity to trade"),
    price: float = typer.Option(None, help="Price for LIMIT orders (Required if type is LIMIT)"),
):
    """
    Place an order on Binance Futures Testnet.
    """
    print_banner()

    # If LIMIT and price is missing, ask for it
    if order_type.upper() == "LIMIT" and price is None:
        price = typer.prompt("Price for LIMIT order", type=float)

    try:
        # Initialize Client
        with console.status("[bold green]Connecting to Binance Testnet..."):
            client = BinanceClientWrapper()
            manager = OrderManager(client)

        # Confirm Order
        table = Table(title="Order Request Summary")
        table.add_column("Parameter", style="cyan")
        table.add_column("Value", style="magenta")
        table.add_row("Symbol", symbol.upper())
        table.add_row("Side", side.upper())
        table.add_row("Type", order_type.upper())
        table.add_row("Quantity", str(quantity))
        if price:
            table.add_row("Price", str(price))
        
        console.print(table)
        
        if not typer.confirm("Do you want to proceed with this order?"):
            console.print("[bold red]Order Cancelled.[/bold red]")
            raise typer.Abort()

        # Execute Order
        with console.status("[bold green]Executing Order..."):
            response = manager.execute_order(
                symbol=symbol,
                side=side,
                order_type=order_type,
                quantity=quantity,
                price=price
            )

        # Output Response
        console.print(Panel("Order Placed Successfully!", style="bold green"))
        
        resp_table = Table(title="Order Response Details")
        resp_table.add_column("Field", style="yellow")
        resp_table.add_column("Value", style="white")
        
        important_fields = ['orderId', 'status', 'executedQty', 'avgPrice', 'symbol', 'side', 'type']
        for key in important_fields:
            if key in response:
                resp_table.add_row(key, str(response[key]))
        
        console.print(resp_table)

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")
        sys.exit(1)

@app.command()
def info():
    """
    Get Account Information.
    """
    print_banner()
    try:
        with console.status("[bold green]Fetching Account Info..."):
            client = BinanceClientWrapper()
            info = client.get_account_info()
            
        console.print(Panel(f"Can Trade: {info['canTrade']}", title="Account Status"))
        
        # Show balances
        table = Table(title="Asset Balances")
        table.add_column("Asset", style="cyan")
        table.add_column("Wallet Balance", style="magenta")
        table.add_column("Unrealized PNL", style="green")

        for asset in info['assets']:
            if float(asset['walletBalance']) > 0:
                table.add_row(
                    asset['asset'], 
                    str(asset['walletBalance']), 
                    str(asset['unrealizedProfit'])
                )
        console.print(table)

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

if __name__ == "__main__":
    app()
