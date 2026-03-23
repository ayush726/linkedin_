import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

const GRADIENT_COLORS = {
  blue: ["#3b82f6", "#6366f1"],
  purple: ["#8b5cf6", "#a855f7"],
  cyan: ["#06b6d4", "#22d3ee"],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-4 py-3 text-xs border-white/10">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground tabular-nums">
        {payload[0].name}:{" "}
        <span className="font-bold gradient-text">{payload[0].value}</span>
      </p>
    </div>
  );
};

export default function ChartsRow({ posts }) {
  if (!posts || posts.length === 0) return null;

  // Posts per month
  const now = new Date();
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    });
  }

  const monthCounts = {};
  monthLabels.forEach((m) => (monthCounts[m.key] = 0));
  posts.forEach((p) => {
    if (p.postedDate) {
      const key = p.postedDate.slice(0, 7);
      if (monthCounts[key] !== undefined) monthCounts[key]++;
    }
  });
  const postsPerMonth = monthLabels.map((m) => ({
    name: m.label,
    posts: monthCounts[m.key] || 0,
  }));

  // Top 10 hashtags
  const hashtagCounts = {};
  posts.forEach((p) => {
    (p.hashtags || []).forEach((h) => {
      const key = h.toLowerCase();
      hashtagCounts[key] = (hashtagCounts[key] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ name: tag, count }));

  // Top 10 most liked
  const topLiked = [...posts]
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, 8)
    .map((p) => ({
      name: (p.authorName || "Unknown").slice(0, 15),
      likes: p.likesCount || 0,
    }));

  const axisStyle = { fontSize: 11, fill: "rgba(255,255,255,0.4)" };

  return (
    <div data-testid="charts-row" className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in animate-fade-in-delay-2">
      {/* Posts per month */}
      <div data-testid="chart-posts-per-month" className="glass-card rounded-xl p-6 lg:col-span-1 transition-all duration-300 hover:-translate-y-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
          Posts per Month
        </p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={postsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="posts" radius={[6, 6, 0, 0]} name="Posts">
                {postsPerMonth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${217 + index * 8}, 91%, ${55 + index * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top hashtags */}
      <div data-testid="chart-top-hashtags" className="glass-card rounded-xl p-6 lg:col-span-1 transition-all duration-300 hover:-translate-y-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
          Top Hashtags
        </p>
        <div className="h-[220px]">
          {topHashtags.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topHashtags} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Count">
                  {topHashtags.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${190 + index * 12}, 80%, ${55 + index * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              No hashtags found
            </div>
          )}
        </div>
      </div>

      {/* Most liked */}
      <div data-testid="chart-most-liked" className="glass-card rounded-xl p-6 lg:col-span-1 transition-all duration-300 hover:-translate-y-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
          Most Liked Posts
        </p>
        <div className="h-[220px]">
          {topLiked.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLiked} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="likes" radius={[0, 6, 6, 0]} name="Likes">
                  {topLiked.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${262 + index * 10}, 70%, ${55 + index * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
