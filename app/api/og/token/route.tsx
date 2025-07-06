import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return new Response('Username is required', { status: 400 })
    }

    // Fetch token data from Supabase
    const { data: tokenData, error } = await supabase
      .from('coins')
      .select('*')
      .eq('creator_username', username)
      .single()

    if (error || !tokenData) {
      return new Response('Token not found', { status: 404 })
    }

    const tokenName = tokenData.name || 'Unknown Token'
    const ticker = tokenData.symbol || 'UNKNOWN'
    const tokenImage = tokenData.image_url || ''
    const creatorUsername = tokenData.creator_username || username
    
    // Define colors for pearl metallic effect
    const colors = {
      pearlPrimary: '#f8fafc',
      pearlSecondary: '#e2e8f0',
      pearlAccent: '#cbd5e1',
      pearlDark: '#94a3b8',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      blue: '#3b82f6'
    }

    // Create HTML-based OG image
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: `linear-gradient(135deg, ${colors.pearlPrimary} 0%, ${colors.pearlSecondary} 25%, ${colors.pearlPrimary} 50%, ${colors.pearlSecondary} 75%, ${colors.pearlAccent} 100%)`, fontFamily: "SF Pro Display, system-ui" }}>
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", width: "90%", height: "70%", borderRadius: "24px", overflow: "hidden", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.5)", background: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.5) 50%, rgba(226,232,240,0.8) 100%)`, border: "2px solid rgba(148, 163, 184, 0.4)" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "35%", padding: "40px 24px", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "200px", height: "200px", borderRadius: "100px", backgroundColor: "rgba(148, 163, 184, 0.2)", marginBottom: "20px", border: "3px solid rgba(100, 116, 139, 0.5)", overflow: "hidden", position: "relative", boxShadow: "inset 0 0 10px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.1)" }}>
                {tokenImage ? (
                  <img src={tokenImage} width="180" height="180" style={{ objectFit: "cover", borderRadius: "50%" }} alt={tokenName} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "180px", height: "180px", borderRadius: "50%", background: `radial-gradient(circle at 30% 30%, ${colors.pearlPrimary} 0%, ${colors.pearlSecondary} 30%, ${colors.pearlAccent} 60%, ${colors.pearlDark} 100%)`, boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.8)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "60px", height: "60px", borderRadius: "50%", border: "3px solid #64748b", marginBottom: "5px", position: "relative" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #64748b" }} />
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: 600, color: "#475569", marginTop: "10px" }}>
                      {ticker.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)", opacity: 0.6, borderRadius: "50%" }} />
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", width: "65%", padding: "40px", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", marginBottom: "40px" }}>
                <span style={{ fontSize: "48px", fontWeight: "bold", color: colors.textPrimary, marginBottom: "10px", textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)" }}>
                  {tokenName}
                </span>
                
                <span style={{ fontSize: "32px", fontWeight: 600, color: colors.textSecondary, marginBottom: "30px" }}>
                  ${ticker.toUpperCase()}
                </span>
                
                <div style={{ display: "flex", fontSize: "24px", color: colors.textSecondary, alignItems: "center" }}>
                  Deployed by{' '}
                  <span style={{ fontWeight: 600, color: colors.blue, marginLeft: "5px" }}>
                    @{creatorUsername}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ position: "absolute", bottom: "40px", right: "80px", fontSize: "22px", fontWeight: 500, color: "rgba(79, 92, 111, 0.7)" }}>
            farcoins.xyz
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 800,
        headers: {
          'Cache-Control': 'public, immutable, no-transform, max-age=300000',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    return new Response('Error generating image', { status: 500 })
  }
}
