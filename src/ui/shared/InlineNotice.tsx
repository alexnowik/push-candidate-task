import { StyleSheet, Text, View } from 'react-native';

type InlineNoticeProps = Readonly<{
  message: string;
  tone?: 'info' | 'warning' | 'error' | undefined;
}>;

export function InlineNotice({ message, tone = 'info' }: InlineNoticeProps) {
  const containerStyle =
    tone === 'error' ? styles.error : tone === 'warning' ? styles.warning : styles.info;
  const textStyle =
    tone === 'error' ? styles.errorText : tone === 'warning' ? styles.warningText : styles.infoText;

  return (
    <View style={containerStyle} accessibilityLiveRegion="polite">
      <Text style={textStyle}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#9ec5fe',
    borderRadius: 8,
    backgroundColor: '#eef6ff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  warning: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bf8700',
    borderRadius: 8,
    backgroundColor: '#fff8c5',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  error: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1242f',
    borderRadius: 8,
    backgroundColor: '#ffebe9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  infoText: { color: '#0969da', fontSize: 13, fontWeight: '600' },
  warningText: { color: '#5f4b00', fontSize: 13, fontWeight: '600' },
  errorText: { color: '#a40e26', fontSize: 13, fontWeight: '600' },
});
