import { YStack, XStack, Button, Text } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable } from 'react-native';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
];

interface ColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPicker({
  open,
  onOpenChange,
  selectedColor,
  onColorSelect,
}: ColorPickerProps) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onPress={() => onOpenChange(false)}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <YStack
            bg="$background"
            borderTopLeftRadius="$4"
            borderTopRightRadius="$4"
            p="$4"
            gap="$4"
            maxHeight="50%"
          >
            <Text fontSize="$6" fontWeight="bold">
              {t('buttons.chooseColor')}
            </Text>
            <YStack gap="$3">
              <XStack flexWrap="wrap" gap="$3" justify="center">
                {PRESET_COLORS.map((color) => (
                  <Button
                    key={color}
                    circular
                    size="$5"
                    bg={color}
                    borderWidth={selectedColor === color ? 3 : 0}
                    borderColor="$color"
                    onPress={() => {
                      onColorSelect(color);
                      onOpenChange(false);
                    }}
                    pressStyle={{ scale: 0.9 }}
                  >
                    {selectedColor === color && (
                      <Check size={20} color="white" />
                    )}
                  </Button>
                ))}
              </XStack>
            </YStack>
            <Button onPress={() => onOpenChange(false)}>
              <Text>{t('common.cancel')}</Text>
            </Button>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
