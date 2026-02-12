import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { BinanceOrder, OrderType, Side } from './api'
import { getPrice, getRecentOrders, placeOrder } from './api'

type Tab = 'order' | 'history'
type Page = 'home' | 'trade' | 'features' | 'profile'
type Theme = 'dark' | 'light'

function TradePage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [side, setSide] = useState<Side>('BUY')
  const [orderType, setOrderType] = useState<OrderType>('LIMIT')
  const [quantity, setQuantity] = useState('0.001')
  const [limitPrice, setLimitPrice] = useState('')

  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  const [orders, setOrders] = useState<BinanceOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<Tab>('order')

  const parsedQuantity = useMemo(() => Number.parseFloat(quantity) || 0, [quantity])
  const parsedLimitPrice = useMemo(
    () => (limitPrice ? Number.parseFloat(limitPrice) || 0 : undefined),
    [limitPrice],
  )

  const formattedPrice = useMemo(
    () => (currentPrice != null ? currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'),
    [currentPrice],
  )

  const isLoggedIn = typeof window !== 'undefined' && !!window.localStorage.getItem('demo-user')

  async function loadPrice() {
    try {
      setPriceLoading(true)
      setError(null)
      const data = await getPrice(symbol)
      setCurrentPrice(data.price)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch price'
      setError(message)
    } finally {
      setPriceLoading(false)
    }
  }

  async function loadOrders() {
    try {
      setOrdersLoading(true)
      setError(null)
      const data = await getRecentOrders(symbol)
      setOrders(data.slice().reverse())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(message)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    void loadPrice()
    void loadOrders()
  }, [symbol])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!parsedQuantity || parsedQuantity <= 0) {
      setError('Quantity must be greater than 0.')
      return
    }

    if (orderType === 'LIMIT' && (!parsedLimitPrice || parsedLimitPrice <= 0)) {
      setError('Limit orders require a valid price.')
      return
    }

    try {
      setSubmitting(true)
      const order = await placeOrder({
        symbol,
        side,
        type: orderType,
        quantity: parsedQuantity,
        price: orderType === 'LIMIT' ? parsedLimitPrice ?? null : null,
      })

      setSuccessMessage(`Order ${order.orderId} submitted with status ${order.status}.`)
      setLimitPrice('')
      void loadOrders()
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Failed to place order'
      let displayMessage = rawMessage

      if (rawMessage.toLowerCase().includes('price less than min price')) {
        displayMessage = `Your limit price is below the allowed minimum for ${symbol.toUpperCase()}. Try a value closer to or above the current market price (${formattedPrice}).`
      }

      setError(displayMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Trading Bot Dashboard</h1>
          <p className="subtitle">Paper trading interface powered by your backend</p>
        </div>
        <div className="symbol-select">
          <label className="field-label">
            Symbol
            <input
              className="input"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            />
          </label>
        </div>
      </header>

      <main className="app-main">
        <section className="card price-card">
          <div className="card-header">
            <h2>Market Overview</h2>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                void loadPrice()
              }}
              disabled={priceLoading}
            >
              {priceLoading ? 'Refreshing…' : 'Refresh price'}
            </button>
          </div>
          <div className="price-display">
            <span className="price-label">{symbol.toUpperCase()}</span>
            <span className="price-value">{formattedPrice}</span>
          </div>
          <p className="muted">Prices are fetched live from your connected backend.</p>
        </section>

        <section className="card form-card">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === 'order' ? 'active' : ''}`}
              onClick={() => setActiveTab('order')}
            >
              New Order
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Order History
            </button>
          </div>

          {activeTab === 'order' ? (
            isLoggedIn ? (
              <form className="order-form" onSubmit={handleSubmit}>
              <div className="field-row">
                <label className="field-label">
                  Side
                  <div className="segmented">
                    <button
                      type="button"
                      className={`segmented-option buy ${side === 'BUY' ? 'active' : ''}`}
                      onClick={() => setSide('BUY')}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      className={`segmented-option sell ${side === 'SELL' ? 'active' : ''}`}
                      onClick={() => setSide('SELL')}
                    >
                      Sell
                    </button>
                  </div>
                </label>

                <label className="field-label">
                  Type
                  <select
                    className="input"
                    value={orderType}
                    onChange={(event) => setOrderType(event.target.value as OrderType)}
                  >
                    <option value="MARKET">Market</option>
                    <option value="LIMIT">Limit</option>
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label className="field-label">
                  Quantity
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.001"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>

                <label className="field-label">
                  {orderType === 'LIMIT' ? 'Your limit price' : 'Price (auto)'}
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={limitPrice}
                    onChange={(event) => setLimitPrice(event.target.value)}
                    disabled={orderType === 'MARKET'}
                    placeholder={orderType === 'MARKET' ? 'Market price' : 'Enter price'}
                  />
                </label>
              </div>

              {error && <div className="alert error">{error}</div>}
              {successMessage && <div className="alert success">{successMessage}</div>}

              <button className="button primary" type="submit" disabled={submitting}>
                {submitting
                  ? 'Submitting order…'
                  : `${side === 'BUY' ? 'Buy' : 'Sell'} ${symbol.toUpperCase()}`}
              </button>

              <p className="muted note">Orders are sent through your configured trading backend.</p>
            </form>
            ) : (
              <div className="order-form">
                <div className="alert error">
                  Please sign in on the Profile page before placing orders.
                </div>
              </div>
            )
          ) : (
            <div className="orders-panel">
              <div className="orders-header">
                <h3>Recent Orders</h3>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => {
                    void loadOrders()
                  }}
                  disabled={ordersLoading}
                >
                  {ordersLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {ordersLoading && <p className="muted">Loading orders…</p>}

              {!ordersLoading && orders.length === 0 && (
                <p className="muted">No recent orders for {symbol.toUpperCase()} yet.</p>
              )}

              {!ordersLoading && orders.length > 0 && (
                <div className="table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Side</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Executed</th>
                        <th>Avg Price</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.orderId}>
                          <td>{order.orderId}</td>
                          <td className={order.side === 'BUY' ? 'buy' : 'sell'}>{order.side}</td>
                          <td>{order.type}</td>
                          <td>{order.status}</td>
                          <td>{order.executedQty ?? '—'}</td>
                          <td>{order.avgPrice ?? '—'}</td>
                          <td>
                            {order.updateTime
                              ? new Date(order.updateTime).toLocaleString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

type HomePageProps = {
  onGoToTrade: () => void
}

function HomePage({ onGoToTrade }: HomePageProps) {
  return (
    <div className="page home-page">
      <section className="hero">
        <h1>Trading Control Center</h1>
        <p>Monitor markets and place test trades through a clean, focused dashboard.</p>
        <div className="hero-actions">
          <button type="button" className="button primary" onClick={onGoToTrade}>
            Go to trading screen
          </button>
        </div>
      </section>
    </div>
  )
}

function FeaturesPage() {
  return (
    <div className="page features-page">
      <h1>Features</h1>
      <div className="features-grid">
        <article className="feature-card">
          <h2>Safe by design</h2>
          <p>Focus on testing strategies with a clear separation between UI and API keys.</p>
        </article>
        <article className="feature-card">
          <h2>Fast order entry</h2>
          <p>
            Quickly place market or limit orders for your favorite symbols with a streamlined form
            and live price updates.
          </p>
        </article>
        <article className="feature-card">
          <h2>Recent order history</h2>
          <p>
            See the latest executions, status, and average prices in a compact table, so you always
            know what the bot has done.
          </p>
        </article>
      </div>
    </div>
  )
}

type DemoUser = {
  name: string
  email: string
  role: string
}

const DEMO_USER: DemoUser = {
  name: 'Demo Trader',
  email: 'trader@example.com',
  role: 'Paper trading only',
}

type ProfilePageProps = {
  user: DemoUser | null
  setUser: (user: DemoUser | null) => void
}

function ProfilePage({ user, setUser }: ProfilePageProps) {
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Demo-only authentication – just check email is non-empty.
    if (!email || !password) {
      setMessage('Enter any email and password to simulate login (demo only).')
      return
    }
    const loggedIn: DemoUser = { ...DEMO_USER, email }
    window.localStorage.setItem('demo-user', JSON.stringify(loggedIn))
    setUser(loggedIn)
    setPassword('')
    setMessage('Logged in (demo). This does not access your real Binance account.')
  }

  const handleLogout = () => {
    window.localStorage.removeItem('demo-user')
    setUser(null)
    setMessage('You have been logged out (demo).')
  }

  if (!user) {
    return (
      <div className="page profile-page">
        <h1>Profile</h1>
        <p className="muted">
          This is a demo authentication screen and does not connect to your real Binance identity.
        </p>
        <form className="profile-form" onSubmit={handleLogin}>
          <label className="field-label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field-label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {message && <div className="alert success">{message}</div>}
          <button type="submit" className="button primary">
            Sign in (demo)
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page profile-page">
      <h1>Your profile</h1>
      <div className="profile-card">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <button type="button" className="button ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<DemoUser | null>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('demo-user') : null
    return stored ? (JSON.parse(stored) as DemoUser) : null
  })
  const [theme, setTheme] = useState<Theme>(() => {
    const stored =
      typeof window !== 'undefined' ? (window.localStorage.getItem('theme') as Theme | null) : null
    return stored ?? 'dark'
  })

  const year = new Date().getFullYear()

  useEffect(() => {
    if (typeof document === 'undefined') return
    const body = document.body
    body.classList.remove('theme-light', 'theme-dark')
    body.classList.add(`theme-${theme}`)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onGoToTrade={() => setPage('trade')} />
      case 'trade':
        return <TradePage />
      case 'features':
        return <FeaturesPage />
      case 'profile':
        return <ProfilePage user={user} setUser={setUser} />
      default:
        return <HomePage onGoToTrade={() => setPage('trade')} />
    }
  }

  return (
    <div className="shell">
      <header className="main-nav">
        <div className="nav-left">
          <button type="button" className="brand" onClick={() => setPage('home')}>
            TEST TRADE
          </button>
        </div>
        <nav className="nav-links">
          <button
            type="button"
            className={`nav-link ${page === 'home' ? 'active' : ''}`}
            onClick={() => setPage('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`nav-link ${page === 'trade' ? 'active' : ''}`}
            onClick={() => setPage('trade')}
          >
            Trade
          </button>
          <button
            type="button"
            className={`nav-link ${page === 'features' ? 'active' : ''}`}
            onClick={() => setPage('features')}
          >
            Features
          </button>
          <button
            type="button"
            className={`nav-link ${page === 'profile' ? 'active' : ''}`}
            onClick={() => setPage('profile')}
          >
            Profile
          </button>
        </nav>
        <button
          type="button"
          className={`theme-toggle-switch ${theme}`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span className="theme-icon moon">☾</span>
          <span className="theme-icon sun">☀</span>
          <span className="theme-toggle-thumb" />
        </button>
      </header>
      {renderPage()}
      <footer className="app-footer">
        <span>© {year} Test Trade</span>
        <span className="dot">•</span>
        <span>Made with ❤️</span>
      </footer>
    </div>
  )
}

export default App
