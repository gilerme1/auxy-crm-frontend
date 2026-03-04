import Swal from 'sweetalert2'

export async function confirmDelete(message: string): Promise<boolean> {
  if (!Swal) {
    // Fallback to native confirm if Swal is not available for any reason
    return window.confirm(message);
  }
  try {
    const res = await Swal.fire({
      title: 'Confirmar borrado',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    return res?.isConfirmed === true;
  } catch {
    return window.confirm(message);
  }
}
