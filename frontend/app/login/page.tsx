"use client";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/status`,
          { withCredentials: true }
        );
        
        if (response.data.message === "Authenticated") {
          router.push("/dashboard");
        }
      } catch (err) {
        // Not authenticated, stay on login page
        console.log("User not authenticated");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);
  
  try {
    // 1. First, make the login request
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, 
      { email, password },
      { withCredentials: true }
    );

    console.log("Login successful, verifying auth status...");

    // 2. Wait a brief moment for the cookie to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Verify that the user is actually authenticated
    const statusResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/status`,
      { withCredentials: true }
    );

    console.log("Auth status after login:", statusResponse.data);

    // 4. Only redirect if properly authenticated
    if (statusResponse.data.message === "Authenticated") {
      router.push("/dashboard");
    } else {
      setError("Authentication failed after login");
    }

  } catch (err: unknown) {
    console.error("Login error:", err);

    let errorMessage = "Login failed due to network or server error.";

    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.message || errorMessage;
    } else if (err instanceof Error) {
      errorMessage = err.message || errorMessage;
    }

    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Secure Login</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            type="email"
            className="border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
            required
            disabled={isLoading}
          />
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            type="password" 
            className="border border-gray-300 p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
            required
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In Securely"}
          </button>
          {error && <p className="text-red-600 text-sm mt-2 text-center font-medium">{error}</p>}
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}