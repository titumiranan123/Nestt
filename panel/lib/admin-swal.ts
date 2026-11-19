import Swal, { type SweetAlertIcon } from "sweetalert2";

const nesttSwalTheme = {
  buttonsStyling: false,
  iconColor: "#075579",
  confirmButtonText: "Got it",
  heightAuto: false,
  customClass: {
    popup: "rounded-lg border border-brand/20 bg-white p-5 font-sans shadow-xl",
    title: "text-lg font-bold tracking-tight text-gray-950",
    htmlContainer: "text-sm leading-relaxed text-gray-600",
    icon: "text-brand",
    actions: "gap-2",
    confirmButton: "rounded-lg border-0 bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20",
    cancelButton: "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200",
  },
};

export function showAdminNotice(title: string, text: string, icon: SweetAlertIcon = "info") {
  return Swal.fire({ ...nesttSwalTheme, icon, titleText: title, text });
}

export async function confirmAdminAction(title: string, text: string) {
  const result = await Swal.fire({
    ...nesttSwalTheme,
    icon: "warning",
    titleText: title,
    text,
    showCancelButton: true,
    confirmButtonText: "Continue",
    cancelButtonText: "Cancel",
    focusCancel: true,
    keydownListenerCapture: true,
    reverseButtons: true,
  });
  return result.isConfirmed;
}
