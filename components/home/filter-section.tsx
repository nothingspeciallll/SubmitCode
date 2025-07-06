"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FilterSectionProps {
  sortBy: string
  onSortChange: (value: string) => void
  filterBy: string
  onFilterChange: (value: string) => void
}

export function FilterSection({ sortBy, onSortChange, filterBy, onFilterChange }: FilterSectionProps) {
  return (
    <div className="flex justify-end space-x-4 mb-6">
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="volume">Volume</SelectItem>
          <SelectItem value="market-cap">Market Cap</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterBy} onValueChange={onFilterChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Pairs</SelectItem>
          <SelectItem value="trending">Trending</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="hot">Hot</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
