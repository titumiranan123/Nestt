"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { siteFont } from "@/lib/fonts";
import type { CatalogProduct } from "@/lib/catalog";
import { ArIcon } from "@/components/shared/ArIcon";
import {
  HomePageBagIcon,
  HomePageChevronDownIcon,
  HomePageMenuIcon,
  HomePageSearchIcon,
  HomePageUserIcon,
} from "@/components/home-page/nestt-furniture-home-page-icons";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { navigationItems } from "./navigation-data";
import { useCart } from "@/components/cart/CartProvider";

export function Navbar() {
  return (
    <Suspense fallback={<NavbarContent />}>
      <RoutedNavbar />
    </Suspense>
  );
}

function RoutedNavbar() {
  const pathname = usePathname();
  return <NavbarContent key={pathname} overHero={pathname === "/"} />;
}

function NavbarContent({ overHero = false }: { overHero?: boolean }) {
  const { openCart, count } = useCart();
  const iconHover = overHero ? "hover:bg-white/10" : "hover:bg-[#f6f5f2]";
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<CatalogProduct[]>();
  const [searchError, setSearchError] = useState(false);
  const root = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeItem = navigationItems.find((item) => item.id === activeMenu);
  const matches = (searchProducts ?? []).filter((product) =>
    `${product.name} ${product.category?.name ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!searchOpen || searchProducts) return;
    const controller = new AbortController();
    setSearchError(false);
    void fetch("/api/products", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Catalog unavailable");
      const data: CatalogProduct[] = await response.json();
      if (!controller.signal.aborted) setSearchProducts(data);
    }).catch(() => {
      if (!controller.signal.aborted) setSearchError(true);
    });
    return () => controller.abort();
  }, [searchOpen, searchProducts]);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function closeNavigation() {
    cancelClose();
    setActiveMenu(null);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }

  function openMenu(id: string) {
    cancelClose();
    setActiveMenu(id);
    setSearchOpen(false);
  }

  useEffect(() => {
    function onOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setActiveMenu(null);
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    }
    function onResize() {
      setActiveMenu(null);
      setMobileMenuOpen(false);
    }
    document.addEventListener("pointerdown", onOutsidePointer);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer);
      window.removeEventListener("resize", onResize);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <header
      ref={root}
      className={`${siteFont.className} inset-x-0 top-0 z-50 border-b ${overHero ? "absolute border-white/10 bg-transparent text-white" : "sticky border-[#e9e7e2] bg-white text-[#252522]"}`}
      onPointerEnter={cancelClose}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse")
          closeTimer.current = setTimeout(() => setActiveMenu(null), 180);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          closeNavigation();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          const restoreId = activeMenu
            ? `navigation-${activeMenu}`
            : mobileMenuOpen
              ? "mobile-menu-trigger"
              : null;
          closeNavigation();
          if (restoreId) document.getElementById(restoreId)?.focus();
        }
      }}
    >
      <div className="relative z-10 mx-auto flex h-16 max-w-[1600px] items-center px-5 lg:px-8">
        <Link
          href={overHero ? "/#home" : "/"}
          aria-label="Nestt home"
          onClick={closeNavigation}
          className="shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f15a22]"
        >
          <Image src="/assets/figma-home/hero-logo.png" alt="" width={136} height={36} preload
            className="h-9 w-[136px] object-cover" />
        </Link>

        <div
          className="relative ml-[31px] mr-auto hidden shrink-0 sm:block"
        >
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchOpen(true);
              setActiveMenu(null);
            }}
            className={`flex h-9 w-[138px] items-center border min-[1500px]:w-[180px] ${overHero ? "border-white/10 bg-black/10 focus-within:border-white/40" : "border-[#e9e7e2] bg-[#f8f7f5] focus-within:border-[#aaa69f]"}`}
          >
            <HomePageSearchIcon
              className={`ml-3 size-[18px] shrink-0 ${overHero ? "text-white/65" : "text-[#85817a]"}`}
            />
            <input
              type="search"
              aria-label="Search furniture"
              placeholder="Search"
              autoComplete="off"
              value={query}
              onFocus={() => {
                setSearchOpen(true);
                setActiveMenu(null);
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
              className={`min-w-0 flex-1 bg-transparent px-2 text-[13px] leading-6 outline-none ${overHero ? "placeholder:text-white/60" : "placeholder:text-[#8d8982]"}`}
            />
          </form>
          {searchOpen && (
            <div className="absolute left-0 top-[calc(100%+18px)] w-[min(350px,80vw)] border border-[#e9e7e2] bg-white p-4 text-[#252522] shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="text-xs text-[#85817a]">
                  {query ? `Results for “${query}”` : "Furniture suggestions"}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search results"
                  className="flex size-8 cursor-pointer items-center justify-center text-xl hover:bg-[#f6f5f2]"
                >
                  ×
                </button>
              </div>
              <ul>
                {matches.length ? (
                  matches.slice(0, 5).map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/products/${encodeURIComponent(product.slug)}`}
                        prefetch={false}
                        onClick={closeNavigation}
                        className="block cursor-pointer px-2 py-3 text-sm hover:bg-[#f6f5f2] focus-visible:outline-2 focus-visible:outline-[#f4131b]"
                      >
                        {product.name}
                        <span className="mt-1 block text-xs text-[#85817a]">
                          {product.category?.name}
                        </span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="py-3 text-sm text-[#85817a]">
                    {searchError ? "Furniture search is unavailable." : searchProducts ? "No furniture found. Try “bed” or “chair”." : "Loading furniture…"}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <nav
          aria-label="Main navigation"
          className="mx-auto hidden h-full items-center gap-5 xl:flex min-[1400px]:gap-7"
        >
          {navigationItems.map((item) => (
            <button
              key={item.id}
              id={`navigation-${item.id}`}
              type="button"
              aria-expanded={activeMenu === item.id}
              aria-controls={`mega-menu-${item.id}`}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") openMenu(item.id);
              }}
              onClick={() => openMenu(item.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  openMenu(item.id);
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLAnchorElement>(
                        `#mega-menu-${item.id} a`,
                      )
                      ?.focus(),
                  );
                }
              }}
              className={`relative inline-flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#f15a22] after:transition-transform hover:text-[#f15a22] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f15a22] ${activeMenu === item.id ? "text-[#f15a22] after:scale-x-100" : "after:scale-x-0"}`}
            >
              {item.label}
              <HomePageChevronDownIcon className={`size-3 transition-transform ${activeMenu === item.id ? "rotate-180" : ""}`} />
            </button>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/ar"
            onClick={closeNavigation}
            aria-label="Explore augmented reality furniture"
            className={`hidden size-9 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-[#f15a22] sm:flex ${iconHover}`}
          >
            <ArIcon className="size-[22px]" />
          </Link>
          <button
            type="button"
            onClick={() => {
              closeNavigation();
              openCart();
            }}
            aria-label="Open shopping bag"
            className={`relative flex size-9 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-[#f15a22] ${iconHover}`}
          >
            <HomePageBagIcon className="size-[22px]" />
            {count > 0 && <span className="absolute ml-6 mt-[-23px] flex size-[16px] items-center justify-center rounded-full bg-[#f15a22] text-[9px] font-semibold text-white">{count > 9 ? "9+" : count}</span>}
          </button>
          <Link
            href="/account"
            onClick={closeNavigation}
            aria-label="Open your account dashboard"
            className={`flex size-9 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-[#f15a22] ${iconHover}`}
          >
            <HomePageUserIcon className="size-[22px]" />
          </Link>
          <button
            id="mobile-menu-trigger"
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              cancelClose();
              setMobileMenuOpen(!mobileMenuOpen);
              setSearchOpen(false);
              setActiveMenu(null);
            }}
            className={`flex size-10 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-[#f15a22] xl:hidden ${iconHover}`}
          >
            {mobileMenuOpen ? (
              <span className="text-3xl">×</span>
            ) : (
              <HomePageMenuIcon className="size-6" />
            )}
          </button>
        </div>
      </div>

      {activeItem && (
        <MegaMenu
          key={activeItem.id}
          item={activeItem}
          onNavigate={closeNavigation}
        />
      )}
      {mobileMenuOpen && <MobileMenu onNavigate={closeNavigation} />}

      {(activeMenu || mobileMenuOpen) && (
        <div
          aria-hidden="true"
          onPointerDown={closeNavigation}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse" && !mobileMenuOpen)
              setActiveMenu(null);
          }}
          className={`fixed inset-x-0 bottom-0 top-[65px] -z-10 bg-black/20 ${mobileMenuOpen ? "xl:hidden" : "hidden xl:block"}`}
        />
      )}
    </header>
  );
}
