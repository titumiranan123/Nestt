"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createInitialState, products } from "@/lib/account/data";
import type { AccountState, Address, Profile } from "@/lib/account/types";

const key = "nestt.account.preview.v1";
type Toast = { message: string; undo?: () => void };
type AccountContextValue = {
  state: AccountState;
  ready: boolean;
  storageError: boolean;
  toast: Toast | null;
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
  notify: (message: string, undo?: () => void) => void;
  dismissToast: () => void;
  toggleWishlist: (id: string) => void;
  addToBag: (productId: string, option: string, quantity?: number) => boolean;
  updateBag: (index: number, quantity: number) => void;
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  makeDefault: (id: string) => void;
  saveProfile: (profile: Profile) => void;
  signOut: () => void;
  resume: () => void;
  cancelOrder: (id: string, reason: string) => void;
  returnItem: (
    id: string,
    itemId: string,
    reason: string,
    note: string,
  ) => void;
};
const AccountContext = createContext<AccountContextValue | null>(null);

function validState(value: unknown): value is AccountState {
  if (!value || typeof value !== "object") return false;
  const s = value as AccountState;
  return (
    s.version === 1 &&
    typeof s.signedOut === "boolean" &&
    !!s.profile &&
    typeof s.profile.name === "string" &&
    typeof s.profile.email === "string" &&
    typeof s.profile.phone === "string" &&
    Array.isArray(s.orders) &&
    s.orders.every(
      (o) =>
        typeof o.id === "string" &&
        Array.isArray(o.items) &&
        Array.isArray(o.returns) &&
        !!o.shipping,
    ) &&
    Array.isArray(s.addresses) &&
    s.addresses.every(
      (a) => typeof a.id === "string" && typeof a.fullName === "string",
    ) &&
    Array.isArray(s.wishlist) &&
    s.wishlist.every((id) => typeof id === "string") &&
    Array.isArray(s.bag) &&
    s.bag.every(
      (i) =>
        typeof i.productId === "string" &&
        typeof i.option === "string" &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0,
    )
  );
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountState>(createInitialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (validState(parsed)) setState(parsed);
        else setStorageError(true);
      }
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        setStorageError(true);
      }
    }
  }, [state, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.undo ? 10000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = useCallback(
    (message: string, undo?: () => void) => setToast({ message, undo }),
    [],
  );
  const toggleWishlist = (id: string) => {
    const removed = state.wishlist.includes(id);
    setState((s) => ({
      ...s,
      wishlist: removed
        ? s.wishlist.filter((p) => p !== id)
        : [...s.wishlist, id],
    }));
    notify(
      removed ? "Removed from your wishlist." : "Saved to your wishlist.",
      removed
        ? () => {
            setState((s) => ({
              ...s,
              wishlist: s.wishlist.includes(id)
                ? s.wishlist
                : [...s.wishlist, id],
            }));
            setToast(null);
          }
        : undefined,
    );
  };
  const addToBag = (productId: string, option: string, quantity = 1) => {
    const p = products.find((p) => p.id === productId);
    const existing = state.bag.find(
      (i) => i.productId === productId && i.option === option,
    );
    const total = state.bag
      .filter((i) => i.productId === productId)
      .reduce((n, i) => n + i.quantity, 0);
    if (
      !p ||
      !p.options.includes(option) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      total + quantity > p.stock
    ) {
      notify("This quantity is not available. Please update your bag.");
      return false;
    }
    setState((s) => ({
      ...s,
      bag: existing
        ? s.bag.map((i) =>
            i.productId === productId && i.option === option
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [...s.bag, { productId, option, quantity }],
    }));
    setBagOpen(true);
    notify("Added to your demo bag.");
    return true;
  };
  const saveAddress = (address: Address) => {
    setState((s) => {
      const editing = s.addresses.some((a) => a.id === address.id);
      const list = editing
        ? s.addresses.map((a) => (a.id === address.id ? address : a))
        : [...s.addresses, address];
      const shipping = address.isDefaultShipping
        ? address.id
        : (list.find((a) => a.id !== address.id && a.isDefaultShipping)?.id ??
          address.id);
      const billing = address.isDefaultBilling
        ? address.id
        : (list.find((a) => a.id !== address.id && a.isDefaultBilling)?.id ??
          address.id);
      return {
        ...s,
        addresses: list.map((a) => ({
          ...a,
          isDefaultShipping: a.id === shipping,
          isDefaultBilling: a.id === billing,
        })),
      };
    });
    notify("Address saved in this browser.");
  };
  const value: AccountContextValue = {
    state,
    ready,
    storageError,
    toast,
    bagOpen,
    setBagOpen,
    notify,
    dismissToast: () => setToast(null),
    toggleWishlist,
    addToBag,
    saveAddress,
    updateBag: (index, quantity) => {
      const item = state.bag[index];
      if (!item) return;
      const p = products.find((p) => p.id === item.productId);
      const others = state.bag
        .filter((i, n) => n !== index && i.productId === item.productId)
        .reduce((n, i) => n + i.quantity, 0);
      if (
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        !p ||
        quantity + others > p.stock
      ) {
        notify("Requested quantity exceeds available stock.");
        return;
      }
      setState((s) => ({
        ...s,
        bag:
          quantity === 0
            ? s.bag.filter((_, n) => n !== index)
            : s.bag.map((i, n) => (n === index ? { ...i, quantity } : i)),
      }));
    },
    deleteAddress: (id) => {
      setState((s) => {
        const list = s.addresses.filter((a) => a.id !== id);
        return {
          ...s,
          addresses: list.map((a, i) => ({
            ...a,
            isDefaultShipping:
              a.isDefaultShipping ||
              (!list.some((a) => a.isDefaultShipping) && i === 0),
            isDefaultBilling:
              a.isDefaultBilling ||
              (!list.some((a) => a.isDefaultBilling) && i === 0),
          })),
        };
      });
      notify("Address deleted.");
    },
    makeDefault: (id) => {
      setState((s) => ({
        ...s,
        addresses: s.addresses.map((a) => ({
          ...a,
          isDefaultShipping: a.id === id,
        })),
      }));
      notify("Default delivery address updated.");
    },
    saveProfile: (profile) => {
      setState((s) => ({
        ...s,
        profile: {
          ...profile,
          isEmailVerified:
            profile.email === s.profile.email && s.profile.isEmailVerified,
          isPhoneVerified:
            profile.phone === s.profile.phone && s.profile.isPhoneVerified,
        },
      }));
      notify("Your profile has been updated in this browser.");
    },
    signOut: () => {
      setState((s) => ({ ...s, signedOut: true }));
      setBagOpen(false);
      setToast(null);
    },
    resume: () => setState((s) => ({ ...s, signedOut: false })),
    cancelOrder: (id, reason) => {
      const o = state.orders.find((o) => o.id === id);
      if (
        !o ||
        !["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status) ||
        o.payment === "PAID"
      ) {
        notify("This order cannot be cancelled. Please contact our team.");
        return;
      }
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === id ? { ...o, status: "CANCELLED", cancelReason: reason } : o,
        ),
      }));
      notify("Demo order cancelled.");
    },
    returnItem: (id, itemId, reason, note) => {
      const o = state.orders.find((o) => o.id === id);
      if (
        !o ||
        o.status !== "DELIVERED" ||
        !o.items.some((i) => i.id === itemId) ||
        o.returns.some((r) => r.itemId === itemId)
      ) {
        notify("This item cannot be returned. Please check your order.");
        return;
      }
      const reference = `RET-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                returns: [
                  ...o.returns,
                  {
                    itemId,
                    reason,
                    note,
                    reference,
                    date: new Date().toISOString().slice(0, 10),
                  },
                ],
              }
            : o,
        ),
      }));
      notify(
        `Demo return recorded: ${reference}. No pickup has been scheduled.`,
      );
    },
  };
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
