import { StyleSheet, Text, View } from 'react-native';

type StatusBadgeProps = Readonly<{
  tone: 'success' | 'neutral';
  label: string;
}>;

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <View style={tone === 'success' ? styles.success : styles.neutral}>
      <Text style={tone === 'success' ? styles.successText : styles.neutralText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  success: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f4ea',
    borderColor: '#1e8e3e',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  neutral: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f3f4',
    borderColor: '#9aa0a6',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  successText: { color: '#1e8e3e', fontSize: 13, fontWeight: '600' },
  neutralText: { color: '#3c4043', fontSize: 13, fontWeight: '500' },
});
