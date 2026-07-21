import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Linking } from 'react-native';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { ScreenHeader, PixelCard } from '../components';

type Props = MainStackScreenProps<'Help'>;

export default function HelpScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Help & Feedback" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <PixelCard style={styles.card}>
          <Text style={styles.heading}>How Rooted works</Text>
          <Text style={styles.body}>
            Every friend is a plant. Logging a call, text, or hangout waters their
            plant; going quiet lets it wilt. Keep your garden green by keeping in
            touch.
          </Text>
        </PixelCard>

        <PixelCard style={styles.card}>
          <Text style={styles.heading}>Feedback</Text>
          <Text style={styles.body}>
            Something broken or missing? We'd love to hear about it — a feedback
            form is coming soon.
          </Text>
        </PixelCard>

        {/* CC BY 4.0 attribution — required by the icon library's license */}
        <Text style={styles.credits}>
          Icons by{' '}
          <Text
            style={styles.creditsLink}
            onPress={() => Linking.openURL('https://pixeliconlibrary.com')}
          >
            HackerNoon Pixel Icon Library
          </Text>
          , licensed under{' '}
          <Text
            style={styles.creditsLink}
            onPress={() => Linking.openURL('https://creativecommons.org/licenses/by/4.0/')}
          >
            CC BY 4.0
          </Text>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.medium,
    gap: Spacing.medium,
  },
  card: {
    padding: Spacing.medium,
  },
  heading: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
    marginBottom: Spacing.small,
  },
  body: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    lineHeight: 21,
  },
  credits: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    marginTop: Spacing.medium,
  },
  creditsLink: {
    textDecorationLine: 'underline',
    color: Colors.textBrown,
  },
});
