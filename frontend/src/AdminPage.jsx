import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  LogOut, 
  Lock, 
  ExternalLink,
  Check,
  X
} from "lucide-react";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    businessName: "",
    reviewLink: "",
    defaultTone: "friendly"
  });

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch clients when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/admin/check`);
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/login`, { password });
      setIsAuthenticated(true);
      setPassword("");
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error("Invalid password");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/admin/logout`);
      setIsAuthenticated(false);
      setClients([]);
      toast.success("Logged out");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/admin/clients`);
      setClients(response.data);
    } catch (error) {
      toast.error("Failed to fetch clients");
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleBusinessNameChange = (value) => {
    setFormData({
      ...formData,
      businessName: value,
      slug: generateSlug(value)
    });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingClient(null);
    setFormData({
      slug: "",
      businessName: "",
      reviewLink: "",
      defaultTone: "friendly"
    });
  };

  const handleEdit = (client) => {
    setEditingClient(client.id);
    setIsAddingNew(false);
    setFormData({
      slug: client.slug,
      businessName: client.businessName,
      reviewLink: client.reviewLink,
      defaultTone: client.defaultTone
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingClient(null);
    setFormData({
      slug: "",
      businessName: "",
      reviewLink: "",
      defaultTone: "friendly"
    });
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.businessName || !formData.reviewLink) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (isAddingNew) {
        await axios.post(`${API}/admin/clients`, formData);
        toast.success("Client added successfully");
      } else {
        await axios.put(`${API}/admin/clients/${editingClient}`, formData);
        toast.success("Client updated successfully");
      }
      fetchClients();
      handleCancel();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (clientId, businessName) => {
    if (!window.confirm(`Are you sure you want to delete "${businessName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/clients/${clientId}`);
      toast.success("Client deleted");
      fetchClients();
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getPublicUrl = (slug) => {
    return `smokingchilimedia.com/review/${slug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-light-bg" data-testid="admin-login-page">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1a1a1a",
              border: "1px solid #E5E7EB",
            },
          }}
        />
        
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-border-subtle mb-4">
                <Lock className="w-8 h-8 text-chili-red" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-text-main">Admin Access</h1>
              <p className="text-text-muted text-sm mt-2">Enter password to continue</p>
            </div>
            
            <form onSubmit={handleLogin} className="card">
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="label-text">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="input-ghost"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoFocus
                    data-testid="admin-password-input"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  data-testid="admin-login-btn"
                >
                  <Lock size={18} />
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-light-bg" data-testid="admin-dashboard">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-main">
              Client Manager
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Manage review booster links for your clients
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full sm:w-auto"
            data-testid="admin-logout-btn"
          >
            <LogOut size={18} />
            Logout
          </button>
        </header>

        {/* Add New Button */}
        {!isAddingNew && !editingClient && (
          <div className="mb-6">
            <button
              onClick={handleAddNew}
              className="btn-primary w-full sm:w-auto"
              data-testid="add-client-btn"
            >
              <Plus size={18} />
              Add New Client
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAddingNew || editingClient) && (
          <div className="card mb-6 animate-fade-in-up" data-testid="client-form">
            <h2 className="font-heading text-lg font-semibold text-text-main mb-4">
              {isAddingNew ? "Add New Client" : "Edit Client"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Business Name *</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={formData.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="e.g. Joe's Coffee Shop"
                  data-testid="form-business-name"
                />
              </div>
              <div>
                <label className="label-text">Slug *</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="e.g. joes-coffee-shop"
                  data-testid="form-slug"
                />
                <p className="text-xs text-text-muted/60 mt-1">
                  URL: /review/{formData.slug || "..."}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="label-text">Google Review Link *</label>
                <input
                  type="url"
                  className="input-ghost"
                  value={formData.reviewLink}
                  onChange={(e) => setFormData({ ...formData, reviewLink: e.target.value })}
                  placeholder="https://g.page/r/..."
                  data-testid="form-review-link"
                />
              </div>
              <div>
                <label className="label-text">Default Tone</label>
                <div className="tone-selector">
                  <button
                    type="button"
                    className={`tone-option ${formData.defaultTone === "friendly" ? "active" : ""}`}
                    onClick={() => setFormData({ ...formData, defaultTone: "friendly" })}
                  >
                    Friendly
                  </button>
                  <button
                    type="button"
                    className={`tone-option ${formData.defaultTone === "professional" ? "active" : ""}`}
                    onClick={() => setFormData({ ...formData, defaultTone: "professional" })}
                  >
                    Professional
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="btn-primary flex-1 sm:flex-none"
                data-testid="form-save-btn"
              >
                <Check size={18} />
                {isAddingNew ? "Add Client" : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex-1 sm:flex-none"
                data-testid="form-cancel-btn"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Clients Table */}
        <div className="card" data-testid="clients-table">
          <h2 className="font-heading text-lg font-semibold text-text-main mb-4">
            Clients ({clients.length})
          </h2>
          
          {clients.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p>No clients yet. Add your first client above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-sm font-medium text-text-muted py-3 px-2">Business</th>
                    <th className="text-left text-sm font-medium text-text-muted py-3 px-2 hidden sm:table-cell">Tone</th>
                    <th className="text-left text-sm font-medium text-text-muted py-3 px-2">Link</th>
                    <th className="text-right text-sm font-medium text-text-muted py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="border-b border-border-subtle/50 hover:bg-white/5 transition-colors"
                      data-testid={`client-row-${client.slug}`}
                    >
                      <td className="py-4 px-2">
                        <div className="font-medium text-text-main">{client.businessName}</div>
                        <div className="text-xs text-text-muted mt-0.5">{client.slug}</div>
                      </td>
                      <td className="py-4 px-2 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          client.defaultTone === "friendly" 
                            ? "bg-chili-red/20 text-chili-red" 
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {client.defaultTone}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-muted truncate max-w-[200px]">
                            {getPublicUrl(client.slug)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`https://${getPublicUrl(client.slug)}`)}
                            className="btn-icon"
                            title="Copy link"
                            data-testid={`copy-link-${client.slug}`}
                          >
                            <Copy size={14} />
                          </button>
                          <a
                            href={`/review/${client.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon"
                            title="Open link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(client)}
                            className="btn-icon"
                            title="Edit"
                            data-testid={`edit-${client.slug}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.businessName)}
                            className="btn-icon hover:text-red-400"
                            title="Delete"
                            data-testid={`delete-${client.slug}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-xs text-text-muted/60">
            Smoking Chili Media Review Booster Admin
          </p>
        </footer>
      </div>
    </div>
  );
}
