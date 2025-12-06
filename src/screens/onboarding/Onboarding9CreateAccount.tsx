import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, PixelInput, ProgressBar, BackButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding9CreateAccount'>;

export default function Onboarding9CreateAccount({ navigation, route }: Props) {
  const { friendName, frequency, plantType } = route.params;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            phone_number: phoneNumber.trim(),
          },
        },
      });

      if (error) throw error;

      // Store the first friend data temporarily (would be saved to database in real implementation)
      // For now, just navigate to completion
      navigation.navigate('Onboarding10Complete');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button and progress bar */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.progressContainer}>
            <ProgressBar current={6} total={6} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>ALMOST THERE!{'\n'}CREATE ACCOUNT</Text>

          {/* Form */}
          <View style={styles.formContainer}>
            <PixelInput
              placeholder="PHONE NUMBER"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <PixelInput
              placeholder="EMAIL"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PixelInput
              placeholder="NAME"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <PixelInput
              placeholder="PASSWORD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Submit Button */}
        <PixelButton
          title={loading ? 'Creating Account...' : 'SUBMIT'}
          onPress={handleSubmit}
          disabled={loading}
        />

        {/* Sign in link */}
        <TouchableOpacity
          style={styles.signInLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInText}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: FontSizes.titleSmall,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 36,
  },
  formContainer: {
    gap: 15,
  },
  signInLink: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInText: {
    color: '#6B4423',
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    textDecorationLine: 'underline',
  },
});
