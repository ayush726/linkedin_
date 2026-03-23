import { Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Searching Google for public posts..." },
  { id: 2, label: "Scraping post details..." },
  { id: 3, label: "Processing results..." },
];

export default function LoadingOverlay({ currentStep = 1 }) {
  return (
    <div data-testid="loading-overlay" className="fixed inset-0 z-50 flex items-center justify-center" style={{
      background: 'radial-gradient(ellipse at center, rgba(15, 18, 35, 0.95) 0%, rgba(8, 10, 20, 0.98) 100%)',
      backdropFilter: 'blur(24px)',
    }}>
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative text-center space-y-8 max-w-md mx-auto px-6">
        {/* Spinner with glow */}
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full gradient-accent opacity-20 animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;
            return (
              <div
                key={step.id}
                data-testid={`loading-step-${step.id}`}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isActive ? "opacity-100 scale-100" : isDone ? "opacity-40 scale-95" : "opacity-20 scale-95"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-500 ${
                    isDone
                      ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30"
                      : isActive
                      ? "gradient-accent text-white shadow-lg shadow-blue-500/30 animate-glow-pulse"
                      : "bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.08]"
                  }`}
                >
                  {isDone ? "\u2713" : step.id}
                </div>
                <span className={`text-sm font-medium transition-colors duration-500 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}>
                  Step {step.id}/3: {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground/60 tracking-wide uppercase font-bold">
          This may take a minute...
        </p>
      </div>
    </div>
  );
}
