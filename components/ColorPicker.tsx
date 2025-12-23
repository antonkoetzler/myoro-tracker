import { Modal, YStack, XStack, Button, Text } from 'tamagui';
import { Check } from '@tamagui/lucide-icons';

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
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      animation="medium"
      snapPoints={[50]}
    >
      <Modal.Overlay />
      <Modal.Content maxWidth={400} bg="$background">
        <Modal.Header>
          <Text fontSize="$6" fontWeight="bold">
            Choose Color
          </Text>
        </Modal.Header>
        <Modal.ScrollView>
          <YStack p="$4" gap="$3">
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
                  {selectedColor === color && <Check size={20} color="white" />}
                </Button>
              ))}
            </XStack>
          </YStack>
        </Modal.ScrollView>
        <Modal.Footer>
          <Button onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
