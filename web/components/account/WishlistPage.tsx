"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "./AccountProvider";
import { Badge, EmptyState, Icon, Modal, PageHeading } from "./ui";
import { money, products } from "@/lib/account/data";
import type { Product } from "@/lib/account/types";

export function WishlistPage() {
  const { state, toggleWishlist } = useAccount();
  const [sort, setSort] = useState("saved");
  const [selected, setSelected] = useState<Product | null>(null);
  const items = [...state.wishlist]
    .reverse()
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
  if (sort === "low") items.sort((a, b) => a.price - b.price);
  if (sort === "high") items.sort((a, b) => b.price - a.price);
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageHeading
        title="Saved for your space."
        description="The pieces you love, ready when you are."
      />
      <div className="wishlist-toolbar">
        <p>
          {items.length} saved item{items.length !== 1 ? "s" : ""}
        </p>
        <label>
          <span className="sr-only">Sort wishlist</span>
          <select
            className="account-input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="saved">Sort: Recently saved</option>
            <option value="low">Price: Low to high</option>
            <option value="high">Price: High to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      {items.length ? (
        <div className="wishlist-grid">
          {items.map((p) => (
            <article className="wishlist-card" key={p.id}>
              <div className="wishlist-image">
                <button
                  className="product-photo-button"
                  onClick={() => setSelected(p)}
                  aria-label={`View ${p.name}`}
                >
                  <Image src={p.image} alt={p.name} width={400} height={310} />
                </button>
                <button
                  className="wishlist-remove"
                  onClick={() => toggleWishlist(p.id)}
                  aria-label={`Remove ${p.name} from wishlist`}
                >
                  <Icon name="heart" size={20} />
                </button>
              </div>
              <div className="wishlist-card-body">
                <p className="product-category">{p.category}</p>
                <h2>
                  <button onClick={() => setSelected(p)}>{p.name}</button>
                </h2>
                <p className="product-finish">{p.finish}</p>
                <Badge tone={p.stock ? "good" : "neutral"}>
                  {p.stock ? "In stock" : "Out of stock"}
                </Badge>
                <strong className="product-price">{money(p.price)}</strong>
                <button
                  className="account-button primary full-width"
                  disabled={!p.stock}
                  onClick={() => setSelected(p)}
                >
                  {!p.stock
                    ? "Currently unavailable"
                    : p.options.length > 1
                      ? "Choose options"
                      : "Add to bag"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="heart"
          title="Make room for your favourites."
          description="Save the pieces you love and come back when you’re ready."
          action={
            <Link className="account-button primary" href="/#recommended">
              Browse furniture <Icon name="arrow" size={16} />
            </Link>
          }
        />
      )}
      <div className="wishlist-note">
        <Icon name="heart" size={18} />
        <p>
          Good things are worth keeping. Your favourites are saved on this
          device.
        </p>
      </div>
      {selected && (
        <ProductOptionsDialog
          key={selected.id}
          product={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function ProductOptionsDialog({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addToBag } = useAccount();
  const [option, setOption] = useState(product.options[0]);
  const [quantity, setQuantity] = useState(1);
  return (
    <Modal title="A closer look" onClose={onClose}>
      <Image
        className="product-options-photo"
        src={product.image}
        alt={product.name}
        width={430}
        height={260}
      />
      <p className="product-category">{product.category}</p>
      <h3 className="product-options-title">{product.name}</h3>
      <strong className="product-price">{money(product.price)}</strong>
      <form
        className="account-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (addToBag(product.id, option, quantity)) onClose();
        }}
      >
        <label className="account-field">
          Finish / Size
          <select value={option} onChange={(e) => setOption(e.target.value)}>
            {product.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="account-field">
          Quantity
          <input
            type="number"
            min={1}
            max={product.stock || 1}
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <p className="account-note">
          {product.stock
            ? `${product.stock} available in the demo catalog. Delivery and assembly are confirmed at checkout.`
            : "This piece is currently unavailable."}
        </p>
        <button
          className="account-button primary full-width"
          type="submit"
          disabled={!product.stock}
        >
          Add to bag ·{" "}
          {money(product.price * (Number.isFinite(quantity) ? quantity : 0))}
        </button>
      </form>
    </Modal>
  );
}
