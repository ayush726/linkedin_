import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ThumbsUp, MessageCircle, Share2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export default function PostCard({ post, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const text = post.postText || "";
  const truncated = text.length > 300;

  const initials = (post.authorName || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-testid="post-card"
      className="glass-card rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fade-in group"
      style={{ animationDelay: `${Math.min(index * 0.06, 0.5)}s`, opacity: 0 }}
    >
      {/* Author */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-lg shadow-blue-500/20 ring-2 ring-white/10">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          {post.authorProfileUrl ? (
            <a
              data-testid="author-link"
              href={post.authorProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-foreground hover:text-blue-400 transition-colors truncate block"
            >
              {post.authorName || "Unknown"}
            </a>
          ) : (
            <span className="text-sm font-semibold text-foreground truncate block">
              {post.authorName || "Unknown"}
            </span>
          )}
          {post.authorTitle && (
            <p className="text-xs text-muted-foreground truncate">{post.authorTitle}</p>
          )}
          {post.postedDate && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 tabular-nums">
              {post.postedDate.slice(0, 10)}
            </p>
          )}
        </div>
      </div>

      {/* Post text */}
      <div className="mb-4">
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {expanded || !truncated ? text : text.slice(0, 300) + "..."}
        </p>
        {truncated && (
          <button
            data-testid="show-more-btn"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Show more <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Engagement stats */}
      <div className="flex items-center gap-5 mb-4 text-xs">
        <span data-testid="likes-count" className="flex items-center gap-1.5 tabular-nums text-blue-400/80">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="text-foreground/70">{post.likesCount || 0}</span>
        </span>
        <span data-testid="comments-count" className="flex items-center gap-1.5 tabular-nums text-violet-400/80">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-foreground/70">{post.commentsCount || 0}</span>
        </span>
        <span data-testid="shares-count" className="flex items-center gap-1.5 tabular-nums text-cyan-400/80">
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-foreground/70">{post.sharesCount || 0}</span>
        </span>
      </div>

      {/* Tags */}
      {((post.hashtags && post.hashtags.length > 0) ||
        (post.mentionedPeople && post.mentionedPeople.length > 0)) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(post.hashtags || []).map((h, i) => (
            <Badge key={`h-${i}`} className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20">
              {h}
            </Badge>
          ))}
          {(post.mentionedPeople || []).map((m, i) => (
            <Badge key={`m-${i}`} className="text-[10px] px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20">
              {m}
            </Badge>
          ))}
        </div>
      )}

      {/* View on LinkedIn */}
      {post.postUrl && (
        <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
          <Button
            data-testid="view-on-linkedin-btn"
            variant="secondary"
            size="sm"
            className="text-xs gap-1.5 active:scale-95 transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-foreground/80 hover:text-foreground"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on LinkedIn
          </Button>
        </a>
      )}
    </div>
  );
}
