"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { accountApi, AccountApiError, accountSessionEnded } from "@/lib/account/api";
import type { AccountState, Address, CustomerOrder, Profile } from "@/lib/account/types";

const empty: AccountState = {
  profile: { id: "", name: "", email: "", phone: "", isEmailVerified: false, isPhoneVerified: false },
  orders: [], addresses: [], wishlist: [],
};

type AccountContextValue = {
  state: AccountState;
  session: "loading" | "signed-out" | "signed-in" | "error";
  loadError: string;
  busy: boolean;
  toast: { message: string; error?: boolean } | null;
  reload: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
  dismissToast: () => void;
  removeWish: (variantId: string) => Promise<boolean>;
  addToBag: (variantId: string, quantity: number) => boolean;
  buyAgain: (order: CustomerOrder) => Promise<boolean>;
  saveAddress: (address: Address) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  makeDefault: (id: string) => Promise<boolean>;
  saveProfile: (name: string) => Promise<boolean>;
  setProfile: (profile: Profile) => void;
  signOut: () => Promise<boolean>;
  cancelOrder: (id: string, reason: string) => Promise<boolean>;
  returnItem: (id: string, itemId: string, reason: string) => Promise<boolean>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

const errorMessage = (error: unknown) =>
  error instanceof AccountApiError ? error.message : "Could not reach your account. Please try again.";

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(empty);
  const [session, setSession] = useState<AccountContextValue["session"]>("loading");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<AccountContextValue["toast"]>(null);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const mutation = useRef(false);
  const sessionChannel = useRef<BroadcastChannel | null>(null);
  const { addItem, addItems, items: cartItems } = useCart();

  const endSession = useCallback(() => {
    generation.current++;
    setState(empty);
    setToast(null);
    setLoadError("");
    setSession("signed-out");
  }, []);

  const reload = useCallback(async () => {
    const attempt = ++generation.current;
    setSession("loading");
    setLoadError("");
    try {
      const profile = await accountApi.profile();
      const [orders, addresses, wishlist] = await Promise.all([
        accountApi.orders(), accountApi.addresses(), accountApi.wishlist(),
      ]);
      if (attempt !== generation.current) return;
      setState({ profile, orders, addresses, wishlist });
      setSession("signed-in");
    } catch (error) {
      if (attempt !== generation.current) return;
      if (error instanceof AccountApiError && error.status === 401) {
        endSession();
        return;
      }
      setState(empty);
      setLoadError(errorMessage(error));
      setSession("error");
    }
  }, [endSession]);

  useEffect(() => {
    window.addEventListener(accountSessionEnded, endSession);
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("nestt-customer-account");
    sessionChannel.current = channel;
    if (channel) channel.onmessage = (event) => { if (event.data === "signed-out") endSession(); };
    void reload();
    return () => {
      generation.current++;
      window.removeEventListener(accountSessionEnded, endSession);
      channel?.close();
      sessionChannel.current = null;
    };
  }, [endSession, reload]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);

  async function mutate(action: () => Promise<void>, success?: string) {
    if (mutation.current) return false;
    const attempt = generation.current;
    mutation.current = true;
    setBusy(true);
    try {
      await action();
      if (success && attempt === generation.current) notify(success);
      return true;
    } catch (error) {
      if (attempt === generation.current) notify(errorMessage(error), true);
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }

  function updateState(update: (current: AccountState) => AccountState) {
    setState((current) => current.profile.id ? update(current) : current);
  }

  function setProfile(profile: Profile) {
    updateState((current) => ({ ...current, profile }));
  }

  async function refreshAfter(section: "addresses" | "orders") {
    const attempt = generation.current;
    try {
      if (section === "addresses") {
        const addresses = await accountApi.addresses();
        updateState((current) => ({ ...current, addresses }));
      } else {
        const orders = await accountApi.orders();
        updateState((current) => ({ ...current, orders }));
      }
      if (attempt === generation.current) setLoadError("");
    } catch {
      if (attempt === generation.current) setLoadError("Your change was saved. Reload your account to see updated details.");
    }
  }

  function addToBag(variantId: string, quantity: number) {
    const product = state.wishlist.find((item) => item.variantId === variantId);
    const existing = cartItems.find((item) => "variantId" in item && item.variantId === variantId)?.quantity ?? 0;
    if (!product?.canAddToCart || !Number.isInteger(quantity) || quantity < 1 || existing + quantity > product.stock) {
      notify("This quantity or finish isn’t available in your cart.", true);
      return false;
    }
    try {
      addItem(variantId, quantity, product.stock);
      return true;
    } catch {
      notify("Could not save to your cart. Check your browser storage settings.", true);
      return false;
    }
  }

  const value: AccountContextValue = {
    state, session, loadError, busy, toast, reload, notify, setProfile,
    dismissToast: () => setToast(null),
    removeWish: (variantId) => mutate(async () => {
      await accountApi.removeWish(variantId);
      updateState((current) => ({
        ...current, wishlist: current.wishlist.filter((item) => item.variantId !== variantId),
      }));
    }, "Removed from your wishlist."),
    addToBag,
    buyAgain: (order) => mutate(async () => {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new AccountApiError("Could not check current catalog stock.", response.status);
      const products: {
        id: string; isPriceOnRequest?: boolean;
        variants?: { id: string; isDefault?: boolean; stockQty: number; stockStatus: string }[];
      }[] = await response.json();
      const offers = new Map(products.flatMap((product) => product.isPriceOnRequest ? [] :
        (product.variants ?? []).map((variant) => [variant.id, variant] as const),
      ));
      const quantities = new Map<string, number>();
      for (const item of order.items) {
        const offer = item.variantId ? offers.get(item.variantId) : undefined;
        if (!offer) throw new AccountApiError(`${item.name} is no longer available to reorder with the same finish.`, 409);
        const quantity = (quantities.get(offer.id) ?? 0) + item.quantity;
        const existing = cartItems.find((entry) => "variantId" in entry && entry.variantId === offer.id)?.quantity ?? 0;
        if (!["IN_STOCK", "LOW_STOCK"].includes(offer.stockStatus) || quantity + existing > offer.stockQty) {
          throw new AccountApiError(`There isn’t enough stock to reorder ${item.name}.`, 409);
        }
        quantities.set(offer.id, quantity);
      }
      addItems([...quantities].map(([variantId, quantity]) => ({ variantId, quantity, stockLimit: offers.get(variantId)!.stockQty })));
    }),
    saveAddress: (address) => mutate(async () => {
      await accountApi.saveAddress(address);
      await refreshAfter("addresses");
    }, "Address saved."),
    deleteAddress: (id) => mutate(async () => {
      await accountApi.deleteAddress(id);
      await refreshAfter("addresses");
    }, "Address deleted."),
    makeDefault: (id) => mutate(async () => {
      await accountApi.setDefaultAddress(id);
      await refreshAfter("addresses");
    }, "Default delivery address updated."),
    saveProfile: (name) => mutate(async () => {
      setProfile(await accountApi.updateProfile(name));
    }, "Your profile has been updated."),
    signOut: () => mutate(async () => {
      await accountApi.signOut();
      endSession();
      sessionChannel.current?.postMessage("signed-out");
    }),
    cancelOrder: (id, reason) => mutate(async () => {
      await accountApi.cancelOrder(id, reason);
      await refreshAfter("orders");
    }, "Order cancelled."),
    returnItem: (id, itemId, reason) => mutate(async () => {
      await accountApi.returnItem(id, itemId, reason);
    }, "Your return request has been sent."),
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
