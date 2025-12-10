"use client";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface FormSchema {
  title: string;
  fields: FormField[];
}

interface Submission {
  _id: string;
  data: Record<string, any>;
  submittedAt: string;
}

interface Form {
  _id: string;
  title: string;
  schema: FormSchema;
  createdAt: string;
  submissions: Submission[];
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [forms, setForms] = useState<Form[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  // Form generation state
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");

  // Check authentication status and load forms
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/status`,
          { withCredentials: true }
        );

        if (response.data.message === "Authenticated") {
          setIsLoading(false);
          setUserName(response.data?.username);
          loadUserForms();
        }
      } catch (err) {
        console.error("Not authenticated:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const loadUserForms = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms`,
        { withCredentials: true }
      );
      setForms(response.data.forms || []);
    } catch (err) {
      console.error("Failed to load forms:", err);
    }
  };

  // Helper function to check if a string is a valid URL
  const isValidUrl = (string: string) => {
    if (typeof string !== 'string') return false;

    try {
      // Check for common URL patterns
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      const hasValidStructure = urlPattern.test(string);

      // Additional check for URLs without protocol
      const withProtocol = string.startsWith('http://') || string.startsWith('https://')
        ? string
        : `https://${string}`;

      new URL(withProtocol);
      return hasValidStructure;
    } catch (_) {
      return false;
    }
  };

  // Helper function to ensure URL has http/https prefix
  const ensureHttpPrefix = (url: string) => {
    if (typeof url !== 'string') return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };
  // In your handleGenerateForm function, update the error handling:
  const handleGenerateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/generate`,
        { prompt, title: title || `Form from: ${prompt.substring(0, 30)}...` },
        { withCredentials: true }
      );

      setForms(prev => [response.data, ...prev]);
      setShowFormModal(false);
      setPrompt("");
      setTitle("");

      // Show success message
      alert("Form generated successfully!");
    } catch (err: unknown) {
      console.error("Form generation failed:", err);

      let errorMessage = "Failed to generate form. Please try again.";

      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      router.push("/login");
    } catch (err: unknown) {
      console.error("Logout failed:", err);

      if (err instanceof Error) {
        console.error("Error details:", err.message);
      }

      setLogoutError("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    alert("Form link copied to clipboard!");
  };

  const viewSubmissions = (form: Form) => {
    setSelectedForm(form);
  };

  const closeModal = () => {
    setSelectedForm(null);
    setShowFormModal(false);
  };

  if (isLoading) {
    return (
      <main className="p-8 max-w-6xl mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Welcome, {userName}</h1>
          <p className="text-gray-600 mt-1">Manage your forms and view submissions</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition duration-200 shadow-md"
          >
            + Create Form
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50 shadow-md"
          >
            {isLoggingOut ? 'Logging Out...' : 'Logout'}
          </button>
        </div>
      </div>

      {logoutError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <span className="block sm:inline">{logoutError}</span>
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No forms yet</h3>
            <p className="text-gray-500 mb-4">Create your first AI-generated form to get started</p>
            <button
              onClick={() => setShowFormModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition duration-200"
            >
              Create Your First Form
            </button>
          </div>
        ) : (
          forms.map((form) => (
            <div key={form._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{form.title}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {form.schema.fields?.length || 0} fields • {form.submissions?.length || 0} submissions
                </p>
                <div className="space-y-1 mb-4">
                  {form.schema.fields?.slice(0, 3).map((field: FormField, index: number) => (
                    <div key={index} className="text-xs text-gray-500 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {field.label} ({field.type})
                    </div>
                  ))}
                  {form.schema.fields?.length > 3 && (
                    <div className="text-xs text-gray-400">+{form.schema.fields.length - 3} more fields</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyFormLink(form._id)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded transition duration-200"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => viewSubmissions(form)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded transition duration-200"
                  >
                    View ({form.submissions?.length || 0})
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Form</h2>
              <form onSubmit={handleGenerateForm}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter form title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe Your Form
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Example: I need a contact form with name, email, message, and file upload..."
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Form'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Submissions for {selectedForm.title}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                {selectedForm.submissions?.length || 0} submissions
              </p>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {!selectedForm.submissions || selectedForm.submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📭</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No submissions yet</h3>
                  <p className="text-gray-500">Share your form link to start collecting responses</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-6">
                    {selectedForm.submissions.map((submission, index) => (
                      <div key={submission._id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-3">
                          Submission {index + 1} • {new Date(submission.submittedAt).toLocaleDateString()}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(submission.data || {}).map(([key, value]) => (
                            <div key={key} className="group bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                              <div className="space-y-2">
                                {/* Key with decorative element */}
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {key}
                                  </span>
                                </div>

                                <div className="pl-3.5">
                                  {Array.isArray(value) ? (
                                    <div className="space-y-2">
                                      {value.map((item, index) => (
                                        <div key={index}>
                                          {isValidUrl(item) ? (
                                            <a
                                              href={ensureHttpPrefix(item)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium underline decoration-2 decoration-blue-200 hover:decoration-blue-400 transition-all duration-200 break-words group-hover:translate-x-0.5"
                                            >
                                              <span>Open file</span>
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                              </svg>
                                            </a>
                                          ) : (
                                            <div className="text-gray-800 leading-relaxed break-words">
                                              {typeof item === 'string' ? item : JSON.stringify(item)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : isValidUrl(value) ? (
                                    <a
                                      href={ensureHttpPrefix(value)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium underline decoration-2 decoration-blue-200 hover:decoration-blue-400 transition-all duration-200 break-words group-hover:translate-x-0.5"
                                    >
                                      <span>{value}</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <div className="text-gray-800 leading-relaxed break-words">
                                      {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}