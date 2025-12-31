import { Toast, useToastController, useToastState } from '@tamagui/toast';
import { Button, H4, XStack, YStack } from 'tamagui';
import { useTranslation } from 'react-i18next';

export function CurrentToast() {
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) return null;

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      viewportName={currentToast.viewportName}
      enterStyle={{ opacity: 0, scale: 0.95, y: 20 }}
      exitStyle={{ opacity: 0, scale: 0.95, y: 20 }}
      y={0}
      theme="accent"
      rounded="$4"
      animation="quick"
      pointerEvents="box-none"
      mx="$4"
      mb="$4"
    >
      <YStack
        items="flex-start"
        p="$2"
        gap="$1"
        pointerEvents="auto"
        width="100%"
      >
        <Toast.Title fontWeight="600" fontSize="$3">
          {currentToast.title}
        </Toast.Title>
        {!!currentToast.message && (
          <Toast.Description fontSize="$2" opacity={0.9}>
            {currentToast.message}
          </Toast.Description>
        )}
      </YStack>
    </Toast>
  );
}

export function ToastControl() {
  const toast = useToastController();
  const { t } = useTranslation();

  return (
    <YStack gap="$2" items="center">
      <H4>{t('common.toastDemo')}</H4>
      <XStack gap="$2" justify="center">
        <Button
          onPress={() => {
            toast.show(t('messages.successfullySaved'), {
              message: t('messages.dontWorry'),
            });
          }}
        >
          {t('common.show')}
        </Button>
        <Button
          onPress={() => {
            toast.hide();
          }}
        >
          {t('common.hide')}
        </Button>
      </XStack>
    </YStack>
  );
}
