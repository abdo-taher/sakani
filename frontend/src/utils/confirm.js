import Swal from "sweetalert2";

export const confirmDelete = async (itemName = "العنصر") => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: `سيتم حذف ${itemName} نهائياً`,
    icon: "warning",

    showCancelButton: true,

    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",

    reverseButtons: true,

    confirmButtonColor: "#DC2626",
    cancelButtonColor: "#A67C52",

    background: "#fff",
    color: "#2B1B12",

    customClass: {
      popup: "rounded-3xl",
      confirmButton: "px-5 py-2 rounded-xl",
      cancelButton: "px-5 py-2 rounded-xl",
    },
  });

  return result.isConfirmed;
};