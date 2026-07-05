"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PWAInstallPrompt } from "@/components/admin/PWAInstallPrompt";
import { LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuthStore();
  const router = useRouter();

  const handleLogin = () => {
    setLoading(true);
    login();
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4 shadow-frap">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiranax Store Management
          </p>
        </div>

        <Button
          onClick={handleLogin}
          className="w-full h-12 text-base rounded-full"
          disabled={loading}
        >
          <LogIn className="h-4 w-4 mr-2" />
          {loading ? "Opening..." : "Enter Admin"}
        </Button>
      </div>

      <PWAInstallPrompt context="admin" />
    </div>
  );
}
