"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { Megaphone, Send } from "lucide-react";

export default function BroadcastPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState(
    "Hello! Check out our latest products and offers at the store."
  );

  const handleSend = () => {
    if (!message) return;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, "_blank");

    toast({
      title: "Broadcast ready!",
      description: "WhatsApp broadcast opened in new tab",
      variant: "success",
    });
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-green-600" />
        <div>
          <h1 className="text-xl font-bold">WhatsApp Broadcast</h1>
          <p className="text-sm text-gray-500">
            Send messages to your customers
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium">Broadcast Message</p>
        <textarea
          className="w-full h-32 rounded-lg border border-gray-300 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your broadcast message..."
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Characters: {message.length}
          </span>
          <Button onClick={handleSend} disabled={!message}>
            <Send className="h-4 w-4 mr-2" />
            Send via WhatsApp
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium">Broadcast History</p>
        <p className="text-xs text-gray-400 py-4 text-center">
          Broadcast history will appear here in future updates
        </p>
      </div>

      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          Note: This opens a manual WhatsApp broadcast. For automated bulk
          messaging, the official WhatsApp Business API will be integrated in a
          future update.
        </p>
      </div>
    </div>
  );
}
