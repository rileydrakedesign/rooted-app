import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Fonts, FontSizes } from '../../constants/fonts';

interface CustomDrawerProps {
  navigation: any;
  state: any;
}

export default function CustomDrawerContent(props: CustomDrawerProps) {
  const { state, navigation } = props;
  const currentRoute = state.routeNames[state.index];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout logic
            Alert.alert('Logged Out', 'You have been logged out');
          },
        },
      ]
    );
  };

  const menuItems = [
    { name: 'Garden', icon: '🏡', label: 'Garden View' },
    { name: 'Friends', icon: '👥', label: 'Friends List' },
    { name: 'Settings', icon: '⚙️', label: 'Settings' },
    { name: 'Help', icon: '❓', label: 'Help & Feedback' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/Logos/RootedLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.divider} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                ]}
                onPress={() => navigation.navigate(item.name as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <View style={styles.profileSection}>
          {/* User Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>R</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>rileydrake</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutButton}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: Spacing.large,
    paddingHorizontal: Spacing.medium,
  },
  logo: {
    width: 120,
    height: 48,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.medium,
  },
  menuContainer: {
    paddingTop: Spacing.large,
    paddingHorizontal: Spacing.medium,
    gap: Spacing.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.medium,
    gap: Spacing.medium,
  },
  menuItemActive: {
    backgroundColor: Colors.sageGreen,
    borderWidth: 3,
    borderColor: Colors.forestGreen,
    borderLeftWidth: 4,
  },
  menuIcon: {
    fontSize: 24,
    width: 32,
  },
  menuLabel: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: Colors.warmWood,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: Colors.forestGreen,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: Spacing.large,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    paddingTop: Spacing.large,
    gap: Spacing.medium,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.warmWood,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: Fonts.pixel,
    color: Colors.white,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  logoutButton: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: '#D32F2F',
    fontWeight: '600',
  },
});
