import { useToastController } from '@tamagui/toast';

let toastController: ReturnType<typeof useToastController> | null = null;

export function setToastController(
  controller: ReturnType<typeof useToastController>,
) {
  toastController = controller;
}

export function showToast(title: string, message?: string) {
  if (toastController) {
    toastController.show(title, { message });
  }
}

export function showSuccess(message: string) {
  showToast('Success', message);
}

export function showError(message: string) {
  showToast('Error', message);
}
