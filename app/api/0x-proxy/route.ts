import { NextRequest, NextResponse } from 'next/server'

const ZERO_X_API_KEY =  process.env.ZERO_X_API_KEY!
const ZERO_X_API_BASE_URL = process.env.ZERO_X_API_BASE_URL!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') // 'price' or 'quote'
    
    if (!endpoint || !['price', 'quote'].includes(endpoint)) {
      return NextResponse.json(
        { error: 'Invalid endpoint. Must be "price" or "quote"' },
        { status: 400 }
      )
    }

    // Remove endpoint from searchParams and build 0x API URL
    searchParams.delete('endpoint')
    const zeroXUrl = `${ZERO_X_API_BASE_URL}/swap/permit2/${endpoint}?${searchParams.toString()}`

    console.log(`🔍 [0x Proxy] Fetching from: ${zeroXUrl}`)

    // Make request to 0x API
    const response = await fetch(zeroXUrl, {
      headers: {
        'Content-Type': 'application/json',
        '0x-version': 'v2',
        '0x-api-key': ZERO_X_API_KEY,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ [0x Proxy] API Error: ${response.status}`, data)
      return NextResponse.json(
        { error: `0x API Error: ${response.status}`, details: data },
        { status: response.status }
      )
    }

    console.log(`✅ [0x Proxy] Success for ${endpoint}`)
    
    // Return the 0x API response
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ [0x Proxy] Internal error:', error)
    return NextResponse.json(
      { error: 'Internal proxy error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, params } = body

    if (!endpoint || !['price', 'quote'].includes(endpoint)) {
      return NextResponse.json(
        { error: 'Invalid endpoint. Must be "price" or "quote"' },
        { status: 400 }
      )
    }

    const searchParams = new URLSearchParams(params)
    const zeroXUrl = `${ZERO_X_API_BASE_URL}/swap/permit2/${endpoint}?${searchParams.toString()}`

    console.log(`🔍 [0x Proxy POST] Fetching from: ${zeroXUrl}`)

    const response = await fetch(zeroXUrl, {
      headers: {
        'Content-Type': 'application/json',
        '0x-version': 'v2',
        '0x-api-key': ZERO_X_API_KEY,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: `0x API Error: ${response.status}`, details: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ [0x Proxy POST] Internal error:', error)
    return NextResponse.json(
      { error: 'Internal proxy error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 