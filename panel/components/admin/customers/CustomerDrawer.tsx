"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import { Camera, PencilLine, Plus, Trash2 } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import type { CustomerStatus, Customer, CustomerDraft } from "@/features/customers/types";
import { showAdminNotice } from "@/lib/admin-swal";
import { CustomerAccountFields } from "./CustomerAccountFields";
import { CustomerProfileSummary } from "./CustomerProfileSummary";
import { CustomerVerificationPanel } from "./CustomerVerificationPanel";
export function CustomerDrawer({ open, mode, customer, draft, status, busy, onDraftChange, onStatusChange, onClose, onSave, onDelete }: { open:boolean;mode:"create"|"edit"|"view"|null;customer:Customer|null;draft:CustomerDraft;busy:boolean;status:CustomerStatus;onDraftChange:(key:keyof CustomerDraft,value:string|boolean)=>void;onStatusChange:(value:CustomerStatus)=>void;onClose:()=>void;onSave:(password: string, avatar: File | null)=>void;onDelete?:()=>void }) {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isCreate = mode === "create";
  const readOnly = mode === "view";
  const photo = previewUrl || (customer?.avatarPath ? `/api/bff${customer.avatarPath}` : "");

  useEffect(() => {
    if (!avatar) return;
    const url = URL.createObjectURL(avatar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  if (!mode || (!customer && !isCreate)) return null;
  const preview = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      void showAdminNotice("Invalid profile photo", "Choose a PNG or JPG image up to 5 MB.", "warning");
      return;
    }
    setAvatar(file);
  };
 return <AdminDrawer open={open} onClose={() => { if (!busy) onClose(); }} title={isCreate?"Create customer":readOnly?"Customer profile":"Edit customer"} description={customer?`${customer.id} · Joined ${new Date(`${customer.joinedAt}T00:00:00`).toLocaleDateString()}`:"Add a customer profile with contact and account information."} widthClassName="max-w-2xl"><form onSubmit={(event) => { event.preventDefault(); if (!busy && !readOnly && (!isCreate || password === confirmPassword)) onSave(password, avatar); }} className="flex max-h-[calc(100vh-4rem)] flex-col"><div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{customer&&!isCreate?<CustomerProfileSummary customer={customer}/>:null}<CustomerAccountFields draft={draft} emailRequired={isCreate} onChange={onDraftChange} disabled={readOnly || busy}/><section className="rounded-2xl border border-gray-200 bg-white p-5"><h3 className="text-base font-bold text-gray-950">Profile image</h3><p className="mb-4 mt-1 text-sm text-gray-500">Use a clear image so the profile is easy to identify in the dashboard.</p><label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand/25 bg-brand-soft/20 px-4 py-6 text-center transition hover:border-accent/40 hover:bg-orange-50/60">{photo?<img src={photo} alt="Customer preview" className="size-20 rounded-full object-cover"/>:<span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand"><Camera size={22}/></span>}<span><strong className="block text-xs font-semibold text-gray-800">Upload profile photo</strong><small className="mt-1 block text-[10px] text-gray-500">PNG or JPG, up to 5 MB</small></span><input type="file" accept="image/png,image/jpeg" disabled={readOnly || busy} onChange={preview} className="sr-only"/></label></section>{isCreate?<section className="rounded-2xl border border-gray-200 bg-white p-5"><h3 className="text-base font-bold text-gray-950">Login access</h3><p className="mb-4 mt-1 text-sm text-gray-500">Set an initial password for this customer account.</p><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-semibold text-gray-700">Password</span><input type="password" required minLength={12} maxLength={128} disabled={busy} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="At least 12 characters" className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"/></label><label><span className="mb-1.5 block text-xs font-semibold text-gray-700">Confirm password</span><input type="password" required minLength={12} maxLength={128} disabled={busy} autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Repeat the password" className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"/></label></div>{confirmPassword&&password!==confirmPassword?<p className="mt-2 text-xs font-medium text-red-600">Passwords do not match.</p>:null}</section>:null}<CustomerVerificationPanel draft={draft} status={status} onDraftChange={onDraftChange} onStatusChange={onStatusChange} disabled={readOnly || busy}/></div><footer className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-gray-200 bg-white/95 px-5 py-4 shadow-[0_-6px_16px_rgba(7,85,121,.06)] backdrop-blur sm:px-6">{!readOnly?<button type="submit" disabled={busy || (isCreate && password !== confirmPassword)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{isCreate?<Plus size={15}/>:<PencilLine size={15}/>} {busy ? "Saving…" : isCreate ? "Create customer" : "Save changes"}</button>:null}{customer&&!isCreate&&onDelete?<button type="button" disabled={busy} onClick={onDelete} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"><Trash2 size={15}/>Delete customer</button>:null}<button type="button" disabled={busy} onClick={onClose} className="ml-auto inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">{readOnly?"Close":"Cancel"}</button></footer></form></AdminDrawer>;
}
