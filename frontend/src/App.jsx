import { useState, useRef, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useParams, Link, Navigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Toaster, toast } from "sonner";
import axios from "axios";
import { Copy, Download, ExternalLink, Sparkles, MessageCircle, Mail, Smartphone, AlertCircle, ArrowLeft, Home } from "lucide-react";
import AdminPage from "./AdminPage.jsx";
import ToolsHub from "./ToolsHub.jsx";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Message templates
const templates = {
  friendly: {
    whatsapp: (businessName, customerName, serviceType) => {
      const greeting = customerName ? `Hi ${customerName}! ` : "Hey there! ";
      const service = serviceType ? ` after your ${serviceType}` : "";
      return `${greeting}Thanks so much for choosing ${businessName}${service}! 🙏

We'd love to hear how your experience was. If you have a moment, could you leave us a quick review? It really helps us out!

{LINK}

Thanks a bunch! ❤️`;
    },
    sms: (businessName, customerName, serviceType) => {
      const greeting = customerName ? `Hi ${customerName}! ` : "";
      const service = serviceType ? ` for your ${serviceType}` : "";
      return `${greeting}Thanks for visiting ${businessName}${service}! We'd appreciate a quick review: {LINK}`;
    },
    email: (businessName, customerName, serviceType) => {
      const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
      const service = serviceType ? ` for your recent ${serviceType}` : "";
      return `Subject: We'd love your feedback! ✨

${greeting}

Thank you so much for choosing ${businessName}${service}! We hope you had a great experience with us.

If you have a minute, we'd really appreciate it if you could share your thoughts in a quick Google review. Your feedback helps us improve and helps others discover us too!

Leave a review here: {LINK}

Thank you for your support – it means the world to us! ❤️

Warm regards,
The ${businessName} Team`;
    }
  },
  professional: {
    whatsapp: (businessName, customerName, serviceType) => {
      const greeting = customerName ? `Dear ${customerName}, ` : "";
      const service = serviceType ? ` regarding your ${serviceType}` : "";
      return `${greeting}Thank you for choosing ${businessName}${service}.

We value your feedback and would appreciate it if you could take a moment to share your experience with us.

Please leave a review here: {LINK}

Thank you for your time.`;
    },
    sms: (businessName, customerName, serviceType) => {
      const greeting = customerName ? `Dear ${customerName}, ` : "";
      const service = serviceType ? ` for your ${serviceType}` : "";
      return `${greeting}Thank you for choosing ${businessName}${service}. We'd appreciate your feedback: {LINK}`;
    },
    email: (businessName, customerName, serviceType) => {
      const greeting = customerName ? `Dear ${customerName},` : "Dear Valued Customer,";
      const service = serviceType ? ` for your recent ${serviceType}` : "";
      return `Subject: Your Feedback Matters to Us

${greeting}

Thank you for choosing ${businessName}${service}. We are committed to providing excellent service and your feedback is invaluable in helping us maintain our standards.

We would be grateful if you could take a moment to share your experience by leaving a review on Google:

{LINK}

Your insights help us serve you better and assist other customers in making informed decisions.

Thank you for your time and continued trust in our services.

Best regards,
${businessName}`;
    }
  }
};

// Redirect component for old routes
function LegacyRedirect() {
  const { slug } = useParams();
  const location = useLocation();
  
  // Handle /review-{slug} → /review/{slug}
  if (slug && slug.startsWith("review-")) {
    const actualSlug = slug.slice(7);
    return <Navigate to={`/review/${actualSlug}`} replace />;
  }
  
  // Fallback - show tools hub
  return <Navigate to="/" replace />;
}

function ReviewBooster() {
  const { slug } = useParams();
  
  const [clientData, setClientData] = useState(null);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(!!slug);
  
  const [businessName, setBusinessName] = useState("");
  const [googleLink, setGoogleLink] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [tone, setTone] = useState("friendly");
  const [generated, setGenerated] = useState(false);
  const [messages, setMessages] = useState({ whatsapp: "", sms: "", email: "" });
  const qrRef = useRef(null);

  // Fetch client data from API when slug is present
  useEffect(() => {
    const fetchClient = async () => {
      if (!slug) {
        setIsLoadingClient(false);
        return;
      }
      
      try {
        const response = await axios.get(`${API}/clients/${slug}`);
        setClientData(response.data);
        setBusinessName(response.data.businessName);
        setGoogleLink(response.data.reviewLink);
        setTone(response.data.defaultTone || "friendly");
        setClientNotFound(false);
      } catch (error) {
        if (error.response?.status === 404) {
          setClientNotFound(true);
        }
      } finally {
        setIsLoadingClient(false);
      }
    };

    fetchClient();
  }, [slug]);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGenerate = () => {
    if (!businessName.trim()) {
      toast.error("Please enter your business name");
      return;
    }
    if (!googleLink.trim()) {
      toast.error("Please enter your Google review link");
      return;
    }
    if (!isValidUrl(googleLink)) {
      toast.error("Please enter a valid URL");
      return;
    }

    const toneTemplates = templates[tone];
    const whatsapp = toneTemplates.whatsapp(businessName.trim(), customerName.trim(), serviceType.trim()).replace("{LINK}", googleLink.trim());
    const sms = toneTemplates.sms(businessName.trim(), customerName.trim(), serviceType.trim()).replace("{LINK}", googleLink.trim());
    const email = toneTemplates.email(businessName.trim(), customerName.trim(), serviceType.trim()).replace("{LINK}", googleLink.trim());

    setMessages({ whatsapp, sms, email });
    setGenerated(true);
    toast.success("Messages generated successfully!");
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const downloadQR = async () => {
    if (qrRef.current) {
      try {
        const dataUrl = await toPng(qrRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `${businessName.trim().replace(/\s+/g, "-").toLowerCase()}-review-qr.png`;
        link.href = dataUrl;
        link.click();
        toast.success("QR code downloaded");
      } catch (err) {
        toast.error("Failed to download QR code");
      }
    }
  };

  const openLink = () => {
    if (googleLink && isValidUrl(googleLink)) {
      window.open(googleLink, "_blank", "noopener,noreferrer");
    }
  };

  // Loading state
  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-matte-black flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  // Client not found state
  if (clientNotFound) {
    return (
      <div className="min-h-screen bg-matte-black" data-testid="not-found-page">
        <div className="noise-overlay" aria-hidden="true" />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#121614",
              color: "#EDEDED",
              border: "1px solid #1F2923",
            },
          }}
        />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-border-subtle mb-6">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-text-main mb-3">
              Link Not Configured
            </h1>
            <p className="text-text-muted mb-6">
              This review link isn't set up yet. Please check the URL or contact the business owner.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/review"
                className="btn-secondary inline-flex items-center justify-center gap-2"
                data-testid="go-review-btn"
              >
                <ArrowLeft size={18} />
                Review Booster
              </Link>
              <Link
                to="/"
                className="btn-secondary inline-flex items-center justify-center gap-2"
                data-testid="go-home-btn"
              >
                <Home size={18} />
                All Tools
              </Link>
            </div>
          </div>
        </div>
        
        <footer className="absolute bottom-8 left-0 right-0 text-center">
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
              className="h-16 w-auto"
            />
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matte-black" data-testid="app-container">
      {/* Noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#121614",
            color: "#EDEDED",
            border: "1px solid #1F2923",
          },
        }}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 animate-fade-in-up" data-testid="header">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-text-muted hover:text-chili-red text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Tools
          </Link>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-text-main tracking-tight mb-3">
            Chili Media Review Booster
          </h1>
          <p className="text-text-muted text-sm sm:text-base">
            Generate a simple review link and message to send customers.
          </p>
        </header>

        {/* Main Card */}
        <main className="flex-1">
          <div className="card animate-fade-in-up delay-100" data-testid="main-card">
            {/* Input Section */}
            <div className="space-y-5">
              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="label-text">
                  Business Name <span className="text-chili-red">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  className="input-ghost"
                  placeholder="e.g. Joe's Coffee Shop"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  data-testid="business-name-input"
                />
              </div>

              {/* Google Review Link */}
              <div>
                <label htmlFor="googleLink" className="label-text">
                  Google Review Link <span className="text-chili-red">*</span>
                </label>
                <input
                  id="googleLink"
                  type="url"
                  className="input-ghost"
                  placeholder="https://g.page/r/..."
                  value={googleLink}
                  onChange={(e) => setGoogleLink(e.target.value)}
                  data-testid="google-link-input"
                />
              </div>

              {/* Customer Name (Optional) */}
              <div>
                <label htmlFor="customerName" className="label-text">
                  Customer Name <span className="text-text-muted/60">(optional)</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  className="input-ghost"
                  placeholder="e.g. Sarah"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  data-testid="customer-name-input"
                />
              </div>

              {/* Service Type (Optional) */}
              <div>
                <label htmlFor="serviceType" className="label-text">
                  Service Provided <span className="text-text-muted/60">(optional)</span>
                </label>
                <input
                  id="serviceType"
                  type="text"
                  className="input-ghost"
                  placeholder="e.g. haircut, car service, consultation"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  data-testid="service-type-input"
                />
              </div>

              {/* Tone Selector */}
              <div>
                <label className="label-text">Message Tone</label>
                <div className="tone-selector" data-testid="tone-selector">
                  <button
                    type="button"
                    className={`tone-option ${tone === "friendly" ? "active" : ""}`}
                    onClick={() => setTone("friendly")}
                    data-testid="tone-friendly-btn"
                  >
                    Friendly
                  </button>
                  <button
                    type="button"
                    className={`tone-option ${tone === "professional" ? "active" : ""}`}
                    onClick={() => setTone("professional")}
                    data-testid="tone-professional-btn"
                  >
                    Professional
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                className="btn-primary mt-6"
                onClick={handleGenerate}
                data-testid="generate-btn"
              >
                <Sparkles size={18} />
                Generate Messages & QR Code
              </button>
            </div>

            {/* Output Section */}
            {generated && (
              <div className="mt-10 space-y-6 animate-fade-in-up" data-testid="output-section">
                <div className="h-px bg-border-subtle" />

                {/* WhatsApp Message */}
                <div className="output-box" data-testid="whatsapp-output">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <MessageCircle size={16} />
                      <span className="text-sm font-medium">WhatsApp Message</span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => copyToClipboard(messages.whatsapp, "WhatsApp message")}
                      title="Copy to clipboard"
                      data-testid="copy-whatsapp-btn"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <textarea
                    className="output-textarea"
                    value={messages.whatsapp}
                    onChange={(e) => setMessages({ ...messages, whatsapp: e.target.value })}
                    data-testid="whatsapp-textarea"
                  />
                </div>

                {/* SMS Message */}
                <div className="output-box" data-testid="sms-output">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Smartphone size={16} />
                      <span className="text-sm font-medium">SMS Message</span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => copyToClipboard(messages.sms, "SMS message")}
                      title="Copy to clipboard"
                      data-testid="copy-sms-btn"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <textarea
                    className="output-textarea"
                    value={messages.sms}
                    onChange={(e) => setMessages({ ...messages, sms: e.target.value })}
                    rows={2}
                    data-testid="sms-textarea"
                  />
                </div>

                {/* Email Template */}
                <div className="output-box" data-testid="email-output">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Mail size={16} />
                      <span className="text-sm font-medium">Email Template</span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => copyToClipboard(messages.email, "Email template")}
                      title="Copy to clipboard"
                      data-testid="copy-email-btn"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <textarea
                    className="output-textarea"
                    value={messages.email}
                    onChange={(e) => setMessages({ ...messages, email: e.target.value })}
                    rows={10}
                    data-testid="email-textarea"
                  />
                </div>

                {/* Review Link */}
                <div className="output-box" data-testid="link-output">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-text-muted">Review Link</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-white/5 rounded-md px-3 py-2 text-sm text-text-main truncate">
                      {googleLink}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary flex-1 sm:flex-none"
                        onClick={() => copyToClipboard(googleLink, "Review link")}
                        data-testid="copy-link-btn"
                      >
                        <Copy size={16} />
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        className="btn-secondary flex-1 sm:flex-none"
                        onClick={openLink}
                        data-testid="open-link-btn"
                      >
                        <ExternalLink size={16} />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="output-box" data-testid="qr-output">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-text-muted">QR Code</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={downloadQR}
                      data-testid="download-qr-btn"
                    >
                      <Download size={16} />
                      <span>Download PNG</span>
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <div
                      ref={qrRef}
                      className="qr-container"
                      data-testid="qr-code-container"
                    >
                      <QRCodeSVG
                        value={googleLink}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Scan to leave a review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 sm:mt-12 animate-fade-in-up delay-200" data-testid="footer">
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
              className="h-16 w-auto"
            />
          </a>
        </footer>
      </div>
    </div>
  );
}

// Main App with routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tools Hub */}
        <Route path="/" element={<ToolsHub />} />
        
        {/* Review Booster Routes */}
        <Route path="/review" element={<ReviewBooster />} />
        <Route path="/review/admin" element={<AdminPage />} />
        <Route path="/review/:slug" element={<ReviewBooster />} />
        
        {/* Legacy Redirects */}
        <Route path="/admin" element={<Navigate to="/review/admin" replace />} />
        <Route path="/:slug" element={<LegacyRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
