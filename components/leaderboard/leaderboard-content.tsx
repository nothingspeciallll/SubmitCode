"use client"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  Users, 
} from "lucide-react"
import { Header } from "@/components/header"
import { Pagination } from "@/components/ui/pagination"
import { type LeaderboardEntry } from "@/lib/leaderboard-service"
import { getMetalClassName, getMetalStyle } from "@/lib/metal-effects"


interface LeaderboardContentProps {
  timeframe: string
  setTimeframe: (timeframe: string) => void
  userRank?: LeaderboardEntry | null
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number
  leaderboard: LeaderboardEntry[]
  handleProfileClick: (entry: LeaderboardEntry) => void
  loading: boolean
  totalPages: number
  handlePageChange: (page: number) => void
  farcasterUser: any
  formatNumber: (num: number) => string
  getRankClass: (rank: number) => string
}

export function LeaderboardContent({
  userRank,
  currentPage,
  setCurrentPage,
  pageSize,
  leaderboard,
  handleProfileClick,
  loading,
  totalPages,
  handlePageChange,
  farcasterUser,
  formatNumber,
  getRankClass,
}: LeaderboardContentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Leaderboard</h1>
            <p className="text-gray-600">Top creators ranked by followers, Neynar score, $GM token Holding, and volume traded,...</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {userRank && (
              <Button
                variant="outline"
                className={`${getMetalClassName('pearl', 'static')} flex items-center gap-2`}
                style={getMetalStyle('pearl')}
                onClick={() => {
                  const page = Math.ceil(userRank.rank / pageSize)
                  setCurrentPage(page)
                }}
              >
                <Users className="h-4 w-4" />
                <span>Your Rank: #{userRank.rank}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="space-y-12 bg-white p-6 rounded-lg shadow-sm">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-14"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            {/* Headers */}
            <div className={`${getMetalClassName('pearl', 'static')} flex justify-between px-4 py-3 border-b`} style={getMetalStyle('pearl')}>
              <div className="text-sm font-medium text-gray-700">Users</div>
              <div className="text-sm font-medium text-gray-700">Points</div>
            </div>
            <table className="w-full">
                  <tbody>
                    {leaderboard.map((entry) => {
                      const isCurrentUser = farcasterUser && entry.fid === farcasterUser.fid
                      const isTopThree = entry.rank <= 3

                      return (
                        <tr
                          key={entry.fid}
                          className={`border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            isCurrentUser ? "bg-blue-50 hover:bg-blue-100" : ""
                          } ${isTopThree ? getRankClass(entry.rank) + " hover:opacity-90" : ""}`}
                          onClick={() => handleProfileClick(entry)}
                          title={
                            entry.latest_token_name
                              ? `Click to view ${entry.latest_token_name} (${entry.latest_token_symbol})`
                              : "Click to view profile"
                          }
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {entry.pfp_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={entry.pfp_url || "/placeholder.svg"}
                                    alt={entry.display_name || entry.username || "User"}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/placeholder.svg"
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 font-medium">
                                      {(entry.display_name || entry.username || "?").charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 group">
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900">
                                    {entry.latest_token_name || entry.display_name || entry.username}
                                  </div>
                                  {entry.power_badge && <Zap className="h-4 w-4 text-yellow-500 ml-1" />}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  {entry.latest_token_symbol && (
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded mr-1">
                                      ${entry.latest_token_symbol}
                                    </span>
                                  )}
                                  @{entry.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold">
                            <span 
                              className={`${getMetalClassName('pearl', 'static')} px-2 py-1 rounded`} 
                              style={getMetalStyle('pearl')}
                            >
                              {formatNumber(entry.rank_score)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
      </main>
    </div>
  )
}