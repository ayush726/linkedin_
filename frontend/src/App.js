import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown, AlertTriangle, Sparkles } from "lucide-react";
import SearchPanel from "@/components/SearchPanel";
import LoadingOverlay from "@/components/LoadingOverlay";
import SummaryBar from "@/components/SummaryBar";
import ChartsRow from "@/components/ChartsRow";
import PostCard from "@/components/PostCard";
import FilterBar from "@/components/FilterBar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [posts, setPosts] = useState([]);
  const [searchKeywords, setSearchKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [apiStatus, setApiStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({
    sortBy: "date-desc",
    tag: "",
    minLikes: 0,
    startDate: null,
    endDate: null,
  });
  const dashboardRef = useRef(null);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${API}/health`);
        setApiStatus(res.data);
        if (!res.data.serper_key_set || !res.data.apify_token_set) {
          setErrorMessage("API keys are not fully configured. Please check your .env file.");
        }
      } catch (e) {
        setErrorMessage("Backend is not reachable. Please check the server.");
      }
    };
    checkHealth();
  }, []);

  // Search handler
  const handleSearch = useCallback(async (keywords, timeRange = "6m") => {
    setIsLoading(true);
    setLoadingStep(1);
    setErrorMessage("");
    setPosts([]);
    setSearchKeywords(keywords);
    setFilters({
      sortBy: "date-desc",
      tag: "",
      minLikes: 0,
      startDate: null,
      endDate: null,
    });

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 5000);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 15000);

    try {
      const res = await axios.post(`${API}/search`, { keywords, timeRange });
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoadingStep(3);

      if (res.data.error && res.data.posts.length === 0) {
        setErrorMessage(res.data.error);
        toast.error(res.data.error);
      } else {
        setPosts(res.data.posts || []);
        if (res.data.error) {
          toast.warning(res.data.error);
        } else {
          toast.success(`Found ${res.data.totalPosts} posts`);
        }
      }
    } catch (e) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const msg = e.response?.data?.detail || "Search failed. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep(1);
    }
  }, []);

  // Filter & sort posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (filters.tag) {
      result = result.filter((p) => {
        const allTags = [
          ...(p.hashtags || []).map((h) => h.toLowerCase()),
          ...(p.mentionedPeople || []).map((m) => m.toLowerCase()),
        ];
        return allTags.includes(filters.tag.toLowerCase());
      });
    }

    if (filters.minLikes > 0) {
      result = result.filter((p) => (p.likesCount || 0) >= filters.minLikes);
    }

    if (filters.startDate) {
      result = result.filter((p) => {
        if (!p.postedDate) return true;
        return new Date(p.postedDate) >= filters.startDate;
      });
    }
    if (filters.endDate) {
      result = result.filter((p) => {
        if (!p.postedDate) return true;
        return new Date(p.postedDate) <= filters.endDate;
      });
    }

    switch (filters.sortBy) {
      case "date-desc":
        result.sort((a, b) => (b.postedDate || "").localeCompare(a.postedDate || ""));
        break;
      case "date-asc":
        result.sort((a, b) => (a.postedDate || "").localeCompare(b.postedDate || ""));
        break;
      case "likes-desc":
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case "comments-desc":
        result.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
        break;
      default:
        break;
    }

    return result;
  }, [posts, filters]);

  // PDF Export
  const handleExportPDF = async () => {
    toast.info("Generating PDF...");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = dashboardRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#0d1117",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.setFillColor(13, 17, 23);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
      pdf.setTextColor(230, 237, 243);
      pdf.setFontSize(14);
      pdf.text("LinkedIn Intelligence Report", 14, 15);
      pdf.setFontSize(9);
      pdf.text(`Keywords: ${searchKeywords.join(", ")}`, 14, 22);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);
      pdf.text(`Total Posts: ${filteredPosts.length}`, 14, 32);

      let yOffset = 38;
      const maxHeight = pdf.internal.pageSize.getHeight() - 20;

      if (pdfHeight + yOffset > maxHeight) {
        let remainingHeight = pdfHeight;
        let sourceY = 0;

        while (remainingHeight > 0) {
          const pageHeight = Math.min(maxHeight - yOffset, remainingHeight);
          const sourceHeight = (pageHeight / pdfHeight) * canvas.height;

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext("2d");
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.8);
          pdf.addImage(pageImgData, "JPEG", 5, yOffset, pdfWidth - 10, pageHeight);

          remainingHeight -= pageHeight;
          sourceY += sourceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
            pdf.setFillColor(13, 17, 23);
            pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
            yOffset = 10;
          }
        }
      } else {
        pdf.addImage(imgData, "JPEG", 5, yOffset, pdfWidth - 10, pdfHeight);
      }

      const keyword = searchKeywords[0] || "search";
      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`linkedin-intelligence-${keyword}-${date}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: 'rgba(30, 35, 50, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e6edf3',
          }
        }}
      />

      {isLoading && <LoadingOverlay currentStep={loadingStep} />}

      {/* Header */}
      <header className="sticky top-0 z-40 glass-header glow-border">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 data-testid="app-title" className="font-heading text-xl font-bold tracking-tight gradient-text">
                LinkedIn Intelligence
              </h1>
            </div>
            <div className="flex-1">
              <SearchPanel onSearch={handleSearch} isLoading={isLoading} />
            </div>
            {posts.length > 0 && (
              <Button
                data-testid="export-pdf-btn"
                onClick={handleExportPDF}
                className="shrink-0 h-10 px-5 gradient-accent text-white hover:opacity-90 rounded-lg font-medium gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Error banner */}
      {errorMessage && posts.length === 0 && !isLoading && (
        <div data-testid="error-banner" className="max-w-[1600px] mx-auto px-6 md:px-8 mt-6">
          <div className="flex items-center gap-3 p-4 glass-card border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      <main ref={dashboardRef} className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 space-y-8">
        {posts.length === 0 && !isLoading && !errorMessage && (
          <div data-testid="empty-state" className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-2xl gradient-accent flex items-center justify-center mb-8 animate-float shadow-lg shadow-blue-500/30">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight mb-3 gradient-text">
              Search LinkedIn Posts
            </h2>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Enter hashtags (#AIIndia), people (@SatyaNadella), or companies (@Google) to discover and analyze public LinkedIn posts.
            </p>
            <div className="flex gap-3 mt-6">
              {["#AI", "#Startups", "@Google"].map((tag) => (
                <span key={tag} className="px-3 py-1.5 text-xs font-medium rounded-full glass-card text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <>
            <SummaryBar posts={posts} />
            <ChartsRow posts={posts} />

            <div className="pt-2">
              <FilterBar posts={posts} filters={filters} onFiltersChange={setFilters} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Showing {filteredPosts.length} of {posts.length} posts
              </p>
            </div>

            <div data-testid="post-cards-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPosts.map((post, idx) => (
                <PostCard key={post.postUrl || idx} post={post} index={idx} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No posts match your current filters. Try adjusting them.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
