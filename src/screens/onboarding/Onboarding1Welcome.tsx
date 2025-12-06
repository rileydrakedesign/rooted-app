import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding1Welcome'>;

export default function Onboarding1Welcome({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={require('../../../assets/images/Logos/RootedLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Plant Image */}
        <Image
          source={require('../../../assets/images/plants/pixellab-Lush-and-full-potted-plant-wit-1764981154908.png')}
          style={styles.plantImage}
          resizeMode="contain"
        />

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Grow deeper connections with the people who matter most.
        </Text>
      </View>

      {/* Get Started Button */}
      <View style={styles.footer}>
        <PixelButton
          title="GET STARTED"
          onPress={() => navigation.navigate('Onboarding2ValueProp')}
        />

        {/* Login Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        >
          <Text style={styles.loginText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3', // Warm beige
    padding: 20,
    paddingTop: 50,
    paddingBottom: 50,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 450,
    height: 144,
    marginBottom: 40,
  },
  plantImage: {
    width: 300,
    height: 300,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: '#6B4423',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    gap: 16,
  },
  loginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginText: {
    color: '#6B4423',
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    textDecorationLine: 'underline',
  },
});
