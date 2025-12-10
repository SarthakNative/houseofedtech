// app/form/[id]/page.tsx (updated)
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { cloudinaryService } from "@/app/services/cloudinaryService";
import toast from 'react-hot-toast';

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  accept?: string;
  multiple?: boolean;
  placeholder:string
}

type FormData = {
  [key: string]: string | number | boolean | string[] | File[] | null;
};

interface Submission {
  _id?: string;           // frontend will just treat ObjectId as string
  data: Record<string, any>;
  submittedAt: string;    // you can use string for JSON dates
}

interface Form {
  _id?: string;
  title: string;
  description?: string;
  owner: string;
  schema: Record<string, any>;  // frontend doesn't need to know the exact Mongoose type
  submissions: Submission[];
}

export default function FormPage() {
  const { id } = useParams(); 
  const [form, setForm] = useState<Form | null>(null);
  const [data, setData] = useState<FormData>({});
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string[]}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${id}`)
      .then((res) => setForm(res.data))
      .catch((err) => console.error("Error fetching form:", err));
  }, [id]);

  const handleFileUpload = async (fieldName: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const fileArray = Array.from(files);
      const uploadResults = await cloudinaryService.uploadMultipleFiles(fileArray);
      const fileUrls = uploadResults.map(result => result.url);
      
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: fileUrls
      }));

      setData(prev => ({
        ...prev,
        [fieldName]: fileUrls
      }));

    } catch (error) {
      console.error(`Error uploading files for ${fieldName}:`, error);
      toast.error(`Failed to upload files for ${fieldName}`, {
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
    }
  };

  const handleInputChange = (fieldName: string, value: string | number | boolean) => {
    setData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submissionData = {
        formId: id,
        data: data,
        uploadedFiles: uploadedFiles,
        submittedAt: new Date().toISOString()
      };

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, submissionData);

        toast.success('Form submitted successfully!', {
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

      console.log("Saved submission:", res.data);
      
      // Reset form
      setData({});
      setUploadedFiles({});
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      toast.error("Error submitting form. Check console for details.", {
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
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "file":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="file"
              multiple={field.multiple || false}
              accept={field.accept}
              required={field.required}
              className="border p-2 w-full"
              onChange={(e) => handleFileUpload(field.name, e.target.files)}
            />
            {uploadedFiles[field.name] && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  ✅ {uploadedFiles[field.name].length} file(s) uploaded successfully
                </p>
                {uploadedFiles[field.name].map((url, index) => (
                  <div key={index} className="text-xs text-gray-600 truncate">
                    {url.split('/').pop()}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              required={field.required}
              className="border p-2 w-full rounded min-h-[100px]"
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              required={field.required}
              className="border p-2 w-full rounded"
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
              />
              <span className="text-sm font-semibold">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          </div>
        );

      case "radio":
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.options?.map(option => (
              <label key={option} className="flex items-center mr-4">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  className="mr-2"
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        );

      default:
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              required={field.required}
              className="border p-2 w-full rounded"
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            />
          </div>
        );
    }
  };

  if (!form) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen p-4 md:p-10 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        {form.schema.description && (
          <p className="text-gray-600 mb-6">{form.schema.description}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.schema.fields.map((field: FormField) => renderField(field))}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded font-semibold w-full transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </form>
      </div>
    </div>
  );
}