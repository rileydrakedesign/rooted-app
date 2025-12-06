import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthStackScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { Fonts, FontSizes } from '../constants/fonts';
import { PixelButton, PixelInput, BackButton } from '../components';

type Props = AuthStackScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
      }
      // Navigation will be handled by auth state listener
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>LOG IN</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <PixelInput
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <PixelInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#8B4513" size="large" />
        </View>
      ) : (
        <PixelButton
          title="LOG IN"
          onPress={handleLogin}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('Onboarding1Welcome')}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          Don't have an account? Get started
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 50,
    backgroundColor: '#F5E6D3', // Match onboarding background
  },
  header: {
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.titleSmall,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#8B4513', // Match onboarding brown
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: FontSizes.label,
    fontFamily: Fonts.subtext,
    fontWeight: '600',
    color: '#6B4423', // Match onboarding text color
    marginBottom: 5,
    marginTop: 10,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#6B4423',
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});
