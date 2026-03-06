import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";

const tools = [
  {
    id: "review-booster",
    name: "Review Booster",
    description: "Generate Google review request messages and QR codes for your customers.",
    icon: Star,
    link: "/review",
    color: "bg-chili-red/20 text-chili-red",
  },
  // Add more tools here as they're built
];

export default function ToolsHub() {
  return (
    <div className="min-h-screen bg-matte-black" data-testid="tools-hub">
      {/* Noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-16 animate-fade-in-up" data-testid="hub-header">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-text-main tracking-tight mb-4">
            Smoking Chili Media Tools
          </h1>
          <p className="text-text-muted text-sm sm:text-base max-w-lg mx-auto">
            Free tools to help your business grow. Built by Smoking Chili Media.
          </p>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" data-testid="tools-grid">
          {tools.map((tool, index) => (
            <Link
              key={tool.id}
              to={tool.link}
              className="card group hover:border-chili-red/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
              data-testid={`tool-card-${tool.id}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${tool.color}`}>
                  <tool.icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-lg font-semibold text-text-main mb-1 group-hover:text-chili-red transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <ArrowRight 
                  size={20} 
                  className="text-text-muted/40 group-hover:text-chili-red group-hover:translate-x-1 transition-all mt-1" 
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon Placeholder */}
        <div className="mt-8 text-center">
          <p className="text-text-muted/60 text-sm">
            More tools coming soon...
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 animate-fade-in-up" data-testid="hub-footer">
          <a 
            href="https://smokingchilimedia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="text-xs text-text-muted">Powered by</span>
            <img 
              src="https://customer-assets.emergentagent.com/job_chili-reviews/artifacts/qc4chsvj_smoking-chili-media-logo-header%20%282%29.png" 
              alt="Smoking Chili Media" 
              className="h-8 w-auto"
            />
          </a>
        </footer>
      </div>
    </div>
  );
}
