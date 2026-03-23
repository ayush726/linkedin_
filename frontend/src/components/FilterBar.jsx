import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { CalendarIcon, SlidersHorizontal, X } from "lucide-react";
import { format } from "date-fns";

export default function FilterBar({ posts, filters, onFiltersChange }) {
  const allTags = useMemo(() => {
    const tags = new Set();
    (posts || []).forEach((p) => {
      (p.hashtags || []).forEach((h) => tags.add(h.toLowerCase()));
      (p.mentionedPeople || []).forEach((m) => tags.add(m.toLowerCase()));
    });
    return Array.from(tags).sort();
  }, [posts]);

  const maxLikes = useMemo(() => {
    return Math.max(...(posts || []).map((p) => p.likesCount || 0), 0);
  }, [posts]);

  const handleSortChange = (val) => {
    onFiltersChange({ ...filters, sortBy: val });
  };

  const handleTagChange = (val) => {
    onFiltersChange({ ...filters, tag: val === "all" ? "" : val });
  };

  const handleMinLikesChange = (val) => {
    onFiltersChange({ ...filters, minLikes: val[0] });
  };

  const handleStartDate = (date) => {
    onFiltersChange({ ...filters, startDate: date || null });
  };

  const handleEndDate = (date) => {
    onFiltersChange({ ...filters, endDate: date || null });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: "date-desc",
      tag: "",
      minLikes: 0,
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = filters.tag || filters.minLikes > 0 || filters.startDate || filters.endDate;

  return (
    <div data-testid="filter-bar" className="flex flex-wrap items-center gap-3 glass-card rounded-xl px-5 py-3.5 animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-widest">
        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
        Filters
      </div>

      {/* Sort */}
      <Select value={filters.sortBy} onValueChange={handleSortChange}>
        <SelectTrigger data-testid="sort-select" className="w-[140px] h-8 text-xs bg-white/[0.04] border-white/[0.08]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="bg-[hsl(222,47%,12%)] border-white/10">
          <SelectItem value="date-desc" className="text-foreground focus:bg-white/[0.06]">Newest first</SelectItem>
          <SelectItem value="date-asc" className="text-foreground focus:bg-white/[0.06]">Oldest first</SelectItem>
          <SelectItem value="likes-desc" className="text-foreground focus:bg-white/[0.06]">Most liked</SelectItem>
          <SelectItem value="comments-desc" className="text-foreground focus:bg-white/[0.06]">Most comments</SelectItem>
        </SelectContent>
      </Select>

      {/* Tag filter */}
      <Select value={filters.tag || "all"} onValueChange={handleTagChange}>
        <SelectTrigger data-testid="tag-filter-select" className="w-[160px] h-8 text-xs bg-white/[0.04] border-white/[0.08]">
          <SelectValue placeholder="Filter by tag" />
        </SelectTrigger>
        <SelectContent className="bg-[hsl(222,47%,12%)] border-white/10 max-h-[250px]">
          <SelectItem value="all" className="text-foreground focus:bg-white/[0.06]">All tags</SelectItem>
          {allTags.map((tag) => (
            <SelectItem key={tag} value={tag} className="text-foreground focus:bg-white/[0.06]">
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range - Start */}
      <Popover>
        <PopoverTrigger asChild>
          <Button data-testid="start-date-btn" variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-white/[0.04] border-white/[0.08] text-foreground hover:bg-white/[0.08]">
            <CalendarIcon className="w-3 h-3 text-blue-400" />
            {filters.startDate ? format(filters.startDate, "MMM d") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[hsl(222,47%,12%)] border-white/10" align="start">
          <Calendar
            mode="single"
            selected={filters.startDate}
            onSelect={handleStartDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Date range - End */}
      <Popover>
        <PopoverTrigger asChild>
          <Button data-testid="end-date-btn" variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-white/[0.04] border-white/[0.08] text-foreground hover:bg-white/[0.08]">
            <CalendarIcon className="w-3 h-3 text-violet-400" />
            {filters.endDate ? format(filters.endDate, "MMM d") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[hsl(222,47%,12%)] border-white/10" align="start">
          <Calendar
            mode="single"
            selected={filters.endDate}
            onSelect={handleEndDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Min likes slider */}
      <div className="flex items-center gap-2 min-w-[160px]">
        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground whitespace-nowrap">
          Min likes
        </span>
        <Slider
          data-testid="min-likes-slider"
          value={[filters.minLikes]}
          onValueChange={handleMinLikesChange}
          max={maxLikes || 100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs tabular-nums font-medium w-8 text-right text-blue-400">{filters.minLikes}</span>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          data-testid="clear-filters-btn"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
        >
          <X className="w-3 h-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
