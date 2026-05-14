"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, Order } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product.id === product.id
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: "wsapp-cart" }
  )
);

interface CustomerState {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  setCustomer: (data: {
    id?: string;
    name: string;
    phone: string;
    address?: string;
  }) => void;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customerId: null,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      setCustomer: (data) =>
        set({
          customerId: data.id || null,
          customerName: data.name,
          customerPhone: data.phone,
          customerAddress: data.address || "",
        }),
      clearCustomer: () =>
        set({
          customerId: null,
          customerName: "",
          customerPhone: "",
          customerAddress: "",
        }),
    }),
    { name: "wsapp-customer" }
  )
);

interface FavoritesState {
  favoriteIds: string[];
  toggle: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggle: (productId) => {
        set((state) => {
          const exists = state.favoriteIds.includes(productId);
          return {
            favoriteIds: exists
              ? state.favoriteIds.filter((id) => id !== productId)
              : [...state.favoriteIds, productId],
          };
        });
      },
      isFavorite: (productId) => get().favoriteIds.includes(productId),
    }),
    { name: "wsapp-favorites" }
  )
);

interface BillingState {
  billItems: CartItem[];
  addBillItem: (product: Product, quantity?: number) => void;
  removeBillItem: (productId: string) => void;
  updateBillQuantity: (productId: string, quantity: number) => void;
  clearBill: () => void;
}

export const useBillingStore = create<BillingState>()((set, get) => ({
  billItems: [],
  addBillItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.billItems.find(
        (i) => i.product.id === product.id
      );
      if (existing) {
        return {
          billItems: state.billItems.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return { billItems: [...state.billItems, { product, quantity }] };
    });
  },
  removeBillItem: (productId) => {
    set((state) => ({
      billItems: state.billItems.filter((i) => i.product.id !== productId),
    }));
  },
  updateBillQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeBillItem(productId);
      return;
    }
    set((state) => ({
      billItems: state.billItems.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }));
  },
  clearBill: () => set({ billItems: [] }),
}));

// Recent scanned items for quick re-selection
interface RecentScansState {
  items: Product[];
  addScan: (product: Product) => void;
}

export const useRecentScansStore = create<RecentScansState>()(
  persist(
    (set) => ({
      items: [],
      addScan: (product) => {
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== product.id);
          return { items: [product, ...filtered].slice(0, 8) };
        });
      },
    }),
    { name: "wsapp-recent-scans" }
  )
);

interface AdminAuthState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
    }),
    { name: "wsapp-admin" }
  )
);

interface OfflineQueueState {
  queue: { action: string; payload: any; timestamp: number }[];
  addToQueue: (action: string, payload: any) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      addToQueue: (action, payload) => {
        set((state) => ({
          queue: [
            ...state.queue,
            { action, payload, timestamp: Date.now() },
          ],
        }));
      },
      processQueue: async () => {
        const { queue } = get();
        if (queue.length === 0) return;

        const processed: number[] = [];
        for (let i = 0; i < queue.length; i++) {
          try {
            const item = queue[i];
            console.log("Processing queued action:", item.action, item.payload);
            processed.push(i);
          } catch (e) {
            console.error("Failed to process queue item:", e);
          }
        }

        set((state) => ({
          queue: state.queue.filter((_, i) => !processed.includes(i)),
        }));
      },
      clearQueue: () => set({ queue: [] }),
    }),
    { name: "wsapp-offline-queue" }
  )
);

// Store open/closed state
interface StoreStatusState {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useStoreStatusStore = create<StoreStatusState>()(
  persist(
    (set) => ({
      isOpen: true,
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
    }),
    { name: "wsapp-store-status" }
  )
);
