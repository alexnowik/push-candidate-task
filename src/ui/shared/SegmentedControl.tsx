import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SegmentedOption<T extends string> = Readonly<{
  value: T;
  label: string;
}>;

type SegmentedControlProps<T extends string> = Readonly<{
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (next: T) => void;
  accessibilityLabel?: string | undefined;
}>;

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => (
        <Segment
          key={option.value}
          option={option}
          selected={option.value === value}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

type SegmentProps<T extends string> = Readonly<{
  option: SegmentedOption<T>;
  selected: boolean;
  onSelect: (next: T) => void;
}>;

// Extracted so the per-segment Pressable handler is stable (closes over its
// own `option.value`) and individual segments can be memoized if profiling
// ever surfaces it as a hotspot.
function Segment<T extends string>({ option, selected, onSelect }: SegmentProps<T>) {
  const handlePress = useCallback(() => onSelect(option.value), [onSelect, option.value]);
  return (
    <Pressable
      onPress={handlePress}
      style={selected ? styles.segmentSelected : styles.segment}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={selected ? styles.segmentTextSelected : styles.segmentText}>{option.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#cfd4dc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  segmentSelected: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1f6feb',
    alignItems: 'center',
  },
  segmentText: { color: '#333', fontSize: 14, fontWeight: '500' },
  segmentTextSelected: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
