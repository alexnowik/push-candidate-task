import { StyleSheet, Text } from 'react-native';

type ErrorTextProps = Readonly<{ message?: string | undefined }>;

export function ErrorText({ message }: ErrorTextProps) {
  if (!message) return null;
  return (
    <Text style={styles.error} accessibilityRole="alert">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: { color: '#b00020', fontSize: 13, marginTop: 6 },
});
