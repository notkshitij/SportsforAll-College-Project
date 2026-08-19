import * as Haptics from 'expo-haptics';

class AudioFeedbackService {
  playSuccessChime() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
  }

  playWarningBuzzer() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (_) {}
  }

  playClick() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
  }
}

export const audioFeedback = new AudioFeedbackService();
