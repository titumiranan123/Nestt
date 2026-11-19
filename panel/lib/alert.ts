export async function toastSuccess(message: string): Promise<void> {
  const Swal = (await import("sweetalert2")).default;
  await Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2800, timerProgressBar: true }).fire({
    icon: "success",
    titleText: message,
  });
}

export async function toastError(message: string): Promise<void> {
  const Swal = (await import("sweetalert2")).default;
  await Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3800, timerProgressBar: true }).fire({
    icon: "error",
    titleText: message,
  });
}

export async function confirmAction(title: string, text?: string): Promise<boolean> {
  const Swal = (await import("sweetalert2")).default;
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Continue",
    cancelButtonText: "Cancel",
    focusCancel: true,
    reverseButtons: true,
  });
  return result.isConfirmed;
}
