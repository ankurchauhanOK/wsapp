"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { Lock } from "lucide-react";
import { PWAInstallPrompt } from "@/components/admin/PWAInstallPrompt";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        login();
        router.push("/admin/dashboard");
      } else {
        toast({
          title: "Invalid password",
          variant: "error",
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4 shadow-frap">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiranax Store Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base rounded-full"
            disabled={loading || !password}
          >
            {loading ? "Checking..." : "Login"}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-400">
          Default password: admin123
        </p>
      </div>

      <PWAInstallPrompt context="admin" />
    </div>
  );
}
