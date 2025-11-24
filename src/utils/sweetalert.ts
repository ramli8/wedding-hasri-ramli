import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface ShowAlertOptions {
  title: string;
  text?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  timer?: number;
  showConfirmButton?: boolean;
  colorMode?: 'light' | 'dark';
}

export const showAlert = ({
  title,
  text,
  icon = 'success',
  timer = 2000,
  showConfirmButton = false,
  colorMode = 'light',
}: ShowAlertOptions) => {
  return MySwal.fire({
    title,
    text,
    icon,
    timer,
    showConfirmButton,
    background: colorMode === 'light' ? '#fff' : '#1A202C',
    color: colorMode === 'light' ? '#1A202C' : '#fff',
    customClass: {
      container: 'swal-high-z-index',
      popup: 'swal-modern-popup',
      title: 'swal-modern-title',
      confirmButton: 'swal-modern-confirm-button',
      cancelButton: 'swal-modern-cancel-button',
    },
    buttonsStyling: false,
    backdrop: `
      rgba(0,0,0,0.4)
      left top
      no-repeat
    `
  });
};

export const showSuccessAlert = (title: string, colorMode: 'light' | 'dark' = 'light') => {
  return showAlert({ title, icon: 'success', colorMode });
};

export const showErrorAlert = (title: string, text?: string, colorMode: 'light' | 'dark' = 'light') => {
  return showAlert({ title, text, icon: 'error', colorMode, timer: 3000, showConfirmButton: true });
};

export const showConfirmationAlert = async (
  title: string,
  text: string,
  confirmButtonText: string = 'Ya, Hapus',
  colorMode: 'light' | 'dark' = 'light',
  isDanger: boolean = false
) => {
  return MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    background: colorMode === 'light' ? '#fff' : '#1A202C',
    color: colorMode === 'light' ? '#1A202C' : '#fff',
    customClass: {
      container: 'swal-high-z-index',
      popup: 'swal-modern-popup',
      title: 'swal-modern-title',
      confirmButton: isDanger ? 'swal-modern-danger-button' : 'swal-modern-confirm-button',
      cancelButton: 'swal-modern-cancel-button',
    },
    buttonsStyling: false,
    backdrop: `
      rgba(0,0,0,0.4)
      left top
      no-repeat
    `
  });
};
