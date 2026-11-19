"use client"

import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react"
import { classes } from "./format"

const buttonStyles = {
  primary: "bg-secondary text-white hover:bg-secondary/90",
  secondary: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  danger: "bg-red-700 text-white hover:bg-red-800",
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={classes(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  )
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  )
}

export function FormToggle({
  label,
  text,
  checked,
  onChange,
}: {
  label: string
  text: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className="flex h-13 cursor-pointer items-center justify-between rounded-xl border border-(--border-default) bg-white px-3 text-left">
        <span className="text-sm font-semibold text-gray-800">{text}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-secondary"
        />
      </span>
    </label>
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={classes(
        "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15",
        className,
      )}
      {...props}
    />
  )
}

export function DrawerFooter({
  children,
  error,
}: {
  children: ReactNode
  error: string
}) {
  return (
    <footer className="sticky bottom-0 shrink-0 space-y-3 border-t border-line bg-white px-5 py-4 sm:px-6">
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>
    </footer>
  )
}
