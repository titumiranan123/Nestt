"use client";

import { useEffect, useState, type FormEvent } from "react";
import { accountApi, normalizedPhone } from "@/lib/account/api";
import { useAccount } from "./AccountProvider";
import { AddressDisplay } from "./OrderDetailsPage";
import { Badge, EmptyState, Icon, Modal, PageHeading } from "./ui";
import type { Address, DeliveryDivision } from "@/lib/account/types";

const emptyAddress: Address = {
  id: "",
  thanaId: "",
  label: "Home",
  fullName: "",
  phone: "",
  region: "",
  city: "",
  area: "",
  addressLine: "",
  postalCode: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export function AddressesPage() {
  const { state, busy, deleteAddress, makeDefault } = useAccount();
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  return (
    <>
      <PageHeading
        title="My addresses"
        description="A familiar place for every delivery."
        action={
          <button
            className="account-button primary"
            onClick={() =>
              setEditing({
                ...emptyAddress,
                fullName: state.profile.name,
                phone: state.profile.phone,
                isDefaultShipping: !state.addresses.length,
                isDefaultBilling: !state.addresses.length,
              })
            }
          >
            + Add new address
          </button>
        }
      />
      {state.addresses.length ? (
        <>
          <p className="address-count">
            {state.addresses.length} saved address
            {state.addresses.length === 1 ? "" : "es"}
          </p>
          <div className="addresses-grid">
            {state.addresses.map((address) => (
              <article className="account-card address-card" key={address.id}>
                <div className="address-card-heading">
                  <Icon
                    name={
                      address.label.toLowerCase() === "office"
                        ? "building"
                        : "home"
                    }
                    size={30}
                  />
                  <h2>{address.label}</h2>
                  <div>
                    {address.isDefaultShipping && (
                      <Badge>Default shipping</Badge>
                    )}
                    {address.isDefaultBilling && <Badge>Default billing</Badge>}
                  </div>
                </div>
                <AddressDisplay address={address} />
                <div className="address-card-actions">
                  <button
                    className="text-link"
                    onClick={() => setEditing(address)}
                  >
                    Edit address
                  </button>
                  <button
                    className="text-link muted"
                    onClick={() => setDeleting(address)}
                  >
                    Delete
                  </button>
                  {!address.isDefaultShipping && (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => void makeDefault(address.id)}
                    >
                      Make default
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="address-tip">
            <Icon name="truck" size={36} />
            <div>
              <h2>The right address makes all the difference.</h2>
              <p>Keep your phone number and delivery details up to date.</p>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon="pin"
          title="A place to call home."
          description="Save your delivery address for a smoother checkout."
          action={
            <button
              className="account-button primary"
              onClick={() =>
                setEditing({
                  ...emptyAddress,
                  fullName: state.profile.name,
                  phone: state.profile.phone,
                  isDefaultShipping: true,
                  isDefaultBilling: true,
                })
              }
            >
              Add your first address
            </button>
          }
        />
      )}
      {editing && (
        <AddressForm address={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <Modal title="Delete this address?" onClose={() => setDeleting(null)}>
          <p className="dialog-description">
            Remove your {deleting.label.toLowerCase()} address from your saved addresses?
            Existing orders keep their original delivery details.
          </p>
          <div className="dialog-actions">
            <button
              className="account-button"
              onClick={() => setDeleting(null)}
            >
              Keep address
            </button>
            <button
              className="account-button primary"
              disabled={busy}
              onClick={async () => {
                if (await deleteAddress(deleting.id)) setDeleting(null);
              }}
            >
              Delete address
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AddressForm({
  address,
  onClose,
}: {
  address: Address;
  onClose: () => void;
}) {
  const { busy, saveAddress } = useAccount();
  const [draft, setDraft] = useState({ ...address });
  const [error, setError] = useState("");
  const [areas, setAreas] = useState<DeliveryDivision[]>([]);
  const [locationStatus, setLocationStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const division = areas.find((area) => area.name === draft.region);
  const district = division?.districts.find((area) => area.name === draft.city);
  const thana = district?.thanas.find((area) => area.id === draft.thanaId);

  useEffect(() => {
    let active = true;
    void accountApi.deliveryAreas().then((response) => {
      if (active) { setAreas(response); setLocationStatus("ready"); }
    }).catch(() => { if (active) setLocationStatus("error"); });
    return () => { active = false; };
  }, [attempt]);

  const update = (key: keyof Address, value: string | boolean) =>
    setDraft((d) => ({ ...d, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const phone = normalizedPhone(draft.phone);
    if (!/^\+?\d{7,15}$/.test(phone)) {
      setError("Enter a valid phone number, including your country code.");
      return;
    }
    if (
      !thana || ![
        draft.label,
        draft.fullName,
        draft.region,
        draft.city,
        draft.area,
        draft.addressLine,
      ].every((s) => s.trim())
    ) {
      setError("Please complete every required field.");
      return;
    }
    if (await saveAddress({
      ...draft,
      label: draft.label.trim(),
      fullName: draft.fullName.trim(),
      phone,
      region: draft.region.trim(),
      city: draft.city.trim(),
      area: draft.area.trim(),
      addressLine: draft.addressLine.trim(),
      postalCode: draft.postalCode.trim(),
    })) onClose();
  }
  return (
    <Modal
      wide
      drawer
      title={draft.id ? "Edit address" : "Add a new address"}
      onClose={onClose}
    >
      <p className="dialog-description">
        A few details to help your next piece find its way home. Fields marked *
        are required.
      </p>
      <form className="account-form" onSubmit={submit}>
        {error && (
          <p className="account-alert" role="alert">
            {error}
          </p>
        )}
        <label className="account-field">
          Address label *
          <input
            required
            maxLength={40}
            value={draft.label}
            placeholder="Home, Office…"
            onChange={(e) => update("label", e.target.value)}
          />
        </label>
        <label className="account-field">
          Full name *
          <input
            required
            autoComplete="shipping name"
            maxLength={100}
            value={draft.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </label>
        <label className="account-field">
          Phone *
          <input
            required
            type="tel"
            autoComplete="shipping tel"
            maxLength={20}
            value={draft.phone}
            onChange={(e) => {
              update("phone", e.target.value);
              setError("");
            }}
            placeholder="+880 1XXXXXXXXX"
          />
          <small>We’ll use this number for delivery updates.</small>
        </label>
        {locationStatus === "loading" && <p className="account-note" role="status">Loading delivery areas…</p>}
        {locationStatus === "error" && <p className="account-alert" role="alert">
          Could not load delivery areas.{" "}
          <button type="button" className="text-link" onClick={() => {
            setLocationStatus("loading");
            setAttempt((value) => value + 1);
          }}>Try again</button>
        </p>}
        <div className="form-row">
          <label className="account-field">
            Division *
            <select
              required
              autoComplete="shipping address-level1"
              disabled={locationStatus !== "ready"}
              value={division?.name ?? ""}
              onChange={(e) => setDraft((current) => ({
                ...current, region: e.target.value, city: "", area: "", thanaId: "",
              }))}
            >
              <option value="">Select division</option>
              {areas.map((area) => (
                <option key={area.id}>{area.name}</option>
              ))}
            </select>
          </label>
          <label className="account-field">
            District / City *
            <select
              required
              autoComplete="shipping address-level2"
              disabled={!division}
              value={district?.name ?? ""}
              onChange={(e) => setDraft((current) => ({
                ...current, city: e.target.value, area: "", thanaId: "",
              }))}
            >
              <option value="">Select district</option>
              {division?.districts.map((area) => <option key={area.id}>{area.name}</option>)}
            </select>
          </label>
        </div>
        <label className="account-field">
          Area / Thana *
          <select
            required
            autoComplete="shipping address-level3"
            disabled={!district}
            value={thana?.id ?? ""}
            onChange={(e) => {
              const selected = district?.thanas.find((area) => area.id === e.target.value);
              setDraft((current) => ({ ...current, area: selected?.name ?? "", thanaId: selected?.id ?? "" }));
            }}
          >
            <option value="">Select thana</option>
            {district?.thanas.map((area) => (
              <option value={area.id} key={area.id}>{area.name}{!area.isDeliverable ? " (delivery unavailable)" : ""}</option>
            ))}
          </select>
        </label>
        <label className="account-field">
          Address line *
          <textarea
            required
            autoComplete="shipping street-address"
            maxLength={500}
            value={draft.addressLine}
            placeholder="House, road, apartment and any useful landmarks"
            onChange={(e) => update("addressLine", e.target.value)}
          />
        </label>
        <label className="account-field">
          Postal code (optional)
          <input
            autoComplete="shipping postal-code"
            inputMode="numeric"
            pattern="[0-9]{4}"
            title="Enter a four digit postal code"
            maxLength={4}
            value={draft.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
          />
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={draft.isDefaultShipping}
            onChange={(e) => update("isDefaultShipping", e.target.checked)}
          />
          Set as default shipping address
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={draft.isDefaultBilling}
            onChange={(e) => update("isDefaultBilling", e.target.checked)}
          />
          Set as default billing address
        </label>
        <div className="dialog-actions">
          <button className="account-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="account-button primary" type="submit" disabled={busy || !thana}>
            {busy ? "Saving…" : "Save address"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
