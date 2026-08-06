import { Alert, Platform } from 'react-native';

export function showPlaceholderDialog(featureName?: string) {
  const title = featureName ? `${featureName}` : 'Feature Preview';
  const message = 'This feature will be available in Version 2.';
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
