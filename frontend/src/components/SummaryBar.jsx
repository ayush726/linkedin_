import { Badge } from "../components/ui/badge";
import { FileText, Calendar, Hash, Users } from "lucide-react";

export default function SummaryBar({ posts }) {
  if (!posts || posts.length === 0) return null;

  const totalPosts = posts.length;

  const dates = posts
    .map((p) => p.postedDate)
    .filter(Boolean)
    .sort();
  const dateRange = dates.length > 0
    ? `${dates[0]?.slice(0, 10) || "N/A"} \u2014 ${dates[dates.length - 1]?.slice(0, 10) || "N/A"}`
    : "N/A";

  const hashtagCounts = {};
  posts.forEach((p) => {
    (p.hashtags || []).forEach((h) => {
      const key = h.toLowerCase();
      hashtagCounts[key] = (hashtagCounts[key] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const peopleCounts = {};
  posts.forEach((p) => {
    (p.mentionedPeople || []).forEach((m) => {
      const key = m.toLowerCase();
      peopleCounts[key] = (peopleCounts[key] || 0) + 1;
    });
  });
  const topPeople = Object.entries(peopleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);

  const stats = [
    {
      icon: FileText,
      label: "TOTAL POSTS",
      value: totalPosts,
      color: "from-blue-500 to-blue-600",
      glow: "shadow-blue-500/20",
    },
    {
      icon: Calendar,
      label: "DATE RANGE",
      value: dateRange,
      isText: true,
      color: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/20",
    },
  ];

  return (
    <div data-testid="summary-bar" className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
            className={`glass-card rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 animate-fade-in animate-fade-in-delay-${i + 1}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 shadow-lg ${stat.glow}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  {stat.label}
                </p>
                {stat.isText ? (
                  <p className="text-sm font-medium mt-1 tabular-nums text-foreground">{stat.value}</p>
                ) : (
                  <p className="text-2xl font-bold font-heading tracking-tight mt-1 tabular-nums gradient-text">
                    {stat.value}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div
          data-testid="top-hashtags-card"
          className="glass-card rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 animate-fade-in animate-fade-in-delay-3"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                TOP HASHTAGS
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topHashtags.length > 0 ? topHashtags.map(([tag, count]) => (
                  <Badge key={tag} className="text-[10px] px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] text-cyan-300 hover:bg-white/[0.1]">
                    {tag} ({count})
                  </Badge>
                )) : (
                  <span className="text-xs text-muted-foreground">None found</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          data-testid="top-people-card"
          className="glass-card rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 animate-fade-in animate-fade-in-delay-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                TOP MENTIONED
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topPeople.length > 0 ? topPeople.map(([name, count]) => (
                  <Badge key={name} className="text-[10px] px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] text-amber-300 hover:bg-white/[0.1]">
                    {name} ({count})
                  </Badge>
                )) : (
                  <span className="text-xs text-muted-foreground">None found</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
