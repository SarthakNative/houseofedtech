"use client";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { 
  ClipboardDocumentIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon 
} from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

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
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Handle form generation
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
      toast.success('Form generated successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '✅',
      });
    } catch (err: unknown) {
      console.error("Form generation failed:", err);

      let errorMessage = "Failed to generate form. Please try again.";

      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      toast.error(errorMessage, {
        duration: 3000,
        position: 'top-right',
        style: {
          background: 'red',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '❌',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle form update
const handleUpdateForm = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingForm || !editTitle.trim()) return;

  setIsUpdating(true);
  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${editingForm._id}`,
      { 
        title: editTitle, 
      },
      { withCredentials: true }
    );

    // Update the form in the local state - merge updated and existing data
    setForms(prev => prev.map(form => {
      if (form._id === editingForm._id) {
        return {
          ...form, // Keep all existing form data
          ...response.data, // Apply updated data from API
          title: editTitle, // Use the updated title
          schema: form.schema || response.data.schema, // Prefer existing schema, fallback to API
          submissions: form.submissions || response.data.submissions // Prefer existing submissions
        };
      }
      return form;
    }));
    
    setEditingForm(null);
    setEditTitle("");

    toast.success('Form updated successfully!', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      icon: '✅',
    });
  } catch (err: unknown) {
    console.error("Form update failed:", err);

    let errorMessage = "Failed to update form. Please try again.";

    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.message || errorMessage;
    } else if (err instanceof Error) {
      errorMessage = err.message || errorMessage;
    }

    toast.error(errorMessage, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: 'red',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      icon: '❌',
    });
  } finally {
    setIsUpdating(false);
  }
};
  // Handle form deletion
  const handleDeleteForm = async () => {
    if (!formToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formToDelete}`,
        { withCredentials: true }
      );

      // Remove the form from local state
      setForms(prev => prev.filter(form => form._id !== formToDelete));
      setFormToDelete(null);

      toast.success('Form deleted successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '✅',
      });
    } catch (err: unknown) {
      console.error("Form deletion failed:", err);

      let errorMessage = "Failed to delete form. Please try again.";

      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      toast.error(errorMessage, {
        duration: 3000,
        position: 'top-right',
        style: {
          background: 'red',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '❌',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit modal with form data
  const openEditModal = (form: Form) => {
    setEditingForm(form);
    setEditTitle(form.title);
    setEditPrompt(form.schema.title || form.title);
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
    toast.success('Form link copied to clipboard', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      icon: '✅',
    });
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition duration-200 shadow-md cursor-pointer"
          >
            + Create Form
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50 shadow-md cursor-pointer"
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
    forms.map((form) => {
      // Check if form.schema exists, otherwise show loading skeleton
      if (!form.schema) {
        return (
          <div key={`loading-${form._id}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Loading skeleton */}
              <div className="animate-pulse">
                {/* Action buttons skeleton */}
                <div className="flex justify-end mb-4">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
                
                {/* Title skeleton */}
                <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                
                {/* Fields/submissions count skeleton */}
                <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                
                {/* Fields list skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-200 rounded-full mr-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-200 rounded-full mr-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-200 rounded-full mr-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                
                {/* Buttons skeleton */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 h-9 bg-gray-200 rounded"></div>
                    <div className="w-10 h-9 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex-1 h-9 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Actual form content when schema is loaded
      return (
        <div key={form._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 relative">
          {/* Action buttons at top right corner */}
          <div className="absolute top-3 right-3 flex gap-1 z-10">
            <button
              onClick={() => openEditModal(form)}
              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-md transition duration-200"
              title="Edit Form"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setFormToDelete(form._id)}
              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition duration-200"
              title="Delete Form"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 pt-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{form.title}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {form.schema.fields?.length || 0} fields • {form.submissions?.length || 0} submissions
            </p>
            <div className="space-y-1 mb-4">
              {form.schema.fields?.slice(0, 3).map((field: FormField, index: number) => (
                <div key={`${form._id}-field-${index}`} className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {field.label} ({field.type})
                </div>
              ))}
              {form.schema.fields?.length > 3 && (
                <div className="text-xs text-gray-400">+{form.schema.fields.length - 3} more fields</div>
              )}
              {form.schema.fields?.length === 0 && (
                <div className="text-xs text-gray-400">No fields defined</div>
              )}
            </div>
            <div className="flex gap-2">
              {/* Open Link + Copy Icon */}
              <div className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => window.open(`${window.location.origin}/form/${form._id}`, "_blank")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded transition duration-200 cursor-pointer"
                >
                  Open Link
                </button>
                <button
                  onClick={() => copyFormLink(form._id)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition duration-200"
                  title="Copy Link"
                >
                  <ClipboardDocumentIcon className="h-5 w-5 cursor-pointer" />
                </button>
              </div>

              {/* View Submissions */}
              <button
                onClick={() => viewSubmissions(form)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded transition duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  <span>({form.submissions?.length || 0})</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    })
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

      {/* Edit Form Modal */}
      {editingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Form</h2>
              <form onSubmit={handleUpdateForm}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter form title..."
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingForm(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !editTitle.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Update Form'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {formToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Delete Form</h2>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to delete this form? This action cannot be undone and all submissions will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormToDelete(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded transition duration-200"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteForm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
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