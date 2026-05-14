"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, Info, ShoppingCart, Check } from "lucide-react";
import type { Alert } from "@/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    loadAlerts();
  }

  const alertIcon = (type: string) => {
    switch (type) {
      case "low_stock":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "order":
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const severityVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive" as const;
      case "medium":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.type === "low_stock" && alert.related_id) {
      router.push(`/admin/products/${alert.related_id}`);
    }
    if (alert.type === "order" && alert.related_id) {
      router.push(`/admin/orders/${alert.related_id}`);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Alerts</h1>
        <Bell className="h-5 w-5 text-gray-400" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="h-12 w-12 mx-auto mb-3" />
          <p className="font-medium">No alerts</p>
          <p className="text-sm mt-1">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg p-4 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-shadow ${
                !alert.read ? "border-l-4 border-green-500" : ""
              }`}
              onClick={() => handleAlertClick(alert)}
            >
              {alertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <Badge variant={severityVariant(alert.severity)} className="text-[9px]">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {formatDate(alert.created_at)} {formatTime(alert.created_at)}
                </p>
              </div>
              {!alert.read && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead(alert.id);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
