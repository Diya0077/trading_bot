const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export type Side = 'BUY' | 'SELL'
export type OrderType = 'MARKET' | 'LIMIT'

export interface PriceResponse {
  symbol: string
  price: number
}

export interface ErrorResponse {
  error: string
  message: string
  code?: number
  [key: string]: unknown
}

export interface PlaceOrderRequest {
  symbol: string
  side: Side
  type: OrderType
  quantity: number
  price?: number | null
}

export interface BinanceOrder {
  orderId: number
  status: string
  side: Side
  type: OrderType
  symbol: string
  updateTime?: number
  executedQty?: string
  avgPrice?: string
  [key: string]: unknown
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    // @ts-expect-error allow empty response body for generic type
    return {}
  }
  return JSON.parse(text) as T
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const errorBody = await parseJson<ErrorResponse | Record<string, unknown>>(res)
    const message =
      typeof (errorBody as ErrorResponse).message === 'string'
        ? (errorBody as ErrorResponse).message
        : `Request failed with status ${res.status}`

    const error = new Error(message)
    ;(error as any).response = errorBody
    ;(error as any).status = res.status
    throw error
  }

  return parseJson<T>(res)
}

export async function getPrice(symbol: string): Promise<PriceResponse> {
  const upper = symbol.toUpperCase()
  return requestJson<PriceResponse>(`${API_BASE_URL}/price/${encodeURIComponent(upper)}`)
}

export async function placeOrder(payload: PlaceOrderRequest): Promise<BinanceOrder> {
  return requestJson<BinanceOrder>(`${API_BASE_URL}/order`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getRecentOrders(symbol: string): Promise<BinanceOrder[]> {
  const upper = symbol.toUpperCase()
  const url = `${API_BASE_URL}/orders?symbol=${encodeURIComponent(upper)}`
  return requestJson<BinanceOrder[]>(url)
}

