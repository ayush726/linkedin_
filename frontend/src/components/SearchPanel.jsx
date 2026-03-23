import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, Plus, X, Clock } from "lucide-react";

const TIME_RANGES = [
  { value: "1w", label: "Past 1 week" },
  { value: "1m", label: "Past 1 month" },
  { value: "3m", label: "Past 3 months" },
  { value: "6m", label: "Past 6 months" },
  { value: "1y", label: "Past 1 year" },
];

export default function SearchPanel({ onSearch, isLoading }) {
  const [inputValue, setInputValue] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [timeRange, setTimeRange] = useState("6m");

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const newKeywords = [...keywords];
    parts.forEach((p) => {
      if (!newKeywords.includes(p)) newKeywords.push(p);
    });
    setKeywords(newKeywords);
    setInputValue("");
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSearch = () => {
    if (keywords.length > 0) {
      onSearch(keywords, timeRange);
    }
  };

  return (
    <div data-testid="search-panel" className="w-full">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="keyword-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter #hashtag, @person, or @company..."
            className="pl-10 h-10 text-sm bg-white/[0.04] border border-white/[0.08] focus:border-[hsl(var(--brand-accent))]/60 focus-visible:ring-1 focus-visible:ring-[hsl(var(--brand-accent))]/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all"
            disabled={isLoading}
          />
        </div>
        <Select value={timeRange} onValueChange={setTimeRange} disabled={isLoading}>
          <SelectTrigger data-testid="time-range-select" className="w-[170px] h-10 shrink-0 text-sm gap-2 bg-white/[0.04] border-white/[0.08]">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(222,47%,12%)] border-white/10">
            {TIME_RANGES.map((tr) => (
              <SelectItem key={tr.value} value={tr.value} className="text-foreground focus:bg-white/[0.06]">
                {tr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          data-testid="add-keyword-btn"
          variant="secondary"
          size="icon"
          onClick={addKeyword}
          disabled={!inputValue.trim() || isLoading}
          className="h-10 w-10 shrink-0 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-foreground"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          data-testid="search-btn"
          onClick={handleSearch}
          disabled={keywords.length === 0 || isLoading}
          className="h-10 px-6 gradient-accent text-white hover:opacity-90 rounded-lg font-medium active:scale-95 transition-all shadow-lg shadow-blue-500/20"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {keywords.length > 0 && (
        <div data-testid="keyword-chips" className="flex flex-wrap gap-2 mt-4">
          {keywords.map((kw, i) => (
            <Badge
              key={kw}
              data-testid={`keyword-chip-${kw}`}
              className="px-3 py-1.5 text-sm font-medium gap-1.5 glass-card text-foreground hover:border-[hsl(var(--brand-accent))]/40 transition-all cursor-default animate-slide-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="gradient-text font-semibold">{kw}</span>
              <button
                data-testid={`remove-keyword-${kw}`}
                onClick={() => removeKeyword(kw)}
                className="ml-1 hover:text-red-400 transition-colors"
                disabled={isLoading}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
