import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { PixelButton, PixelInput, ProgressBar, BackButton } from '../components';

type Props = MainStackScreenProps<'AddFriend'>;

/** Step 1 of the main add-friend flow (name → frequency → plant). */
export default function AddFriendScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [friendName, setFriendName] = useState('');

  const handleAddFriend = () => {
    if (!friendName.trim()) {
      Alert.alert('Please enter a friend name');
      return;
    }
    navigation.navigate('SetFrequency', { friendName: friendName.trim() });
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.small, paddingBottom: insets.bottom + Spacing.large },
      ]}
    >
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={1} total={3} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>ADD A FRIEND!</Text>

        <View style={styles.inputContainer}>
          <PixelInput
            placeholder="Friend's name"
            value={friendName}
            onChangeText={setFriendName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <PixelButton title="NEXT" onPress={handleAddFriend} />
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSizes.titleMedium,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    color: Colors.warmWood,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipText: {
    color: Colors.textBrownMuted,
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    textDecorationLine: 'underline',
  },
});
