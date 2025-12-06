import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, PixelInput, ProgressBar, BackButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding4AddFriend'>;

export default function Onboarding4AddFriend({ navigation }: Props) {
  const [friendName, setFriendName] = useState('');

  const handleAddFriend = () => {
    if (!friendName.trim()) {
      Alert.alert('Please enter a friend name');
      return;
    }
    navigation.navigate('Onboarding5Frequency', { friendName: friendName.trim() });
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={3} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>ADD YOUR FIRST FRIEND!</Text>

        {/* Search/Input */}
        <View style={styles.inputContainer}>
          <PixelInput
            placeholder="Search Contacts"
            value={friendName}
            onChangeText={setFriendName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.orText}>or enter manually</Text>

        {/* Add Friend Button */}
        <PixelButton
          title="+ ADD FRIEND"
          onPress={handleAddFriend}
        />
      </View>

      {/* Skip option */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
    paddingTop: 50,
    paddingBottom: 50,
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
    color: '#8B4513',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  orText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: '#A0826D',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipText: {
    color: '#A0826D',
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    textDecorationLine: 'underline',
  },
});
