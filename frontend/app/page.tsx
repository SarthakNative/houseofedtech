// app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/status`,
          { withCredentials: true }
        );
        
        if (response.data.message === "Authenticated") {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } catch (err) {
        // Not authenticated, redirect to login
        router.push("/login");
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking authentication status...</p>
      </div>
    </div>
  );
}