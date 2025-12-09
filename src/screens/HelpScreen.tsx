import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Help & Feedback</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  content: {
    padding: Spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.titleMedium,
    fontFamily: Fonts.heading,
    color: Colors.forestGreen,
    marginBottom: Spacing.medium,
  },
  subtitle: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: Colors.textSecondary,
  },
});
