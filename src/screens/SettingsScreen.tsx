import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { Colors } from '../constants/theme';

type Props = MainTabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [streakCelebrations, setStreakCelebrations] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState('8:00 AM');
  const [gardenTheme, setGardenTheme] = useState('Cozy Greenhouse');
  const [friendLimit] = useState({ current: 12, max: 20 });
  const userEmail = 'rileydrake@email.com';

  const handleBack = () => {
    navigation.goBack();
  };

  const handleProfile = () => {
    Alert.alert('Profile', 'Profile screen coming soon');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Change password screen coming soon');
  };

  const handleDailyReminderTime = () => {
    Alert.alert('Daily Reminder Time', 'Time picker coming soon');
  };

  const handleGardenTheme = () => {
    Alert.alert('Garden Theme', 'Theme selector coming soon');
  };

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
            Alert.alert('Logged Out', 'You have been logged out');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={styles.spacer} />
        </View>

        <View style={styles.divider} />

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* ACCOUNT Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ACCOUNT</Text>

            <View style={styles.card}>
              {/* Profile */}
              <TouchableOpacity style={styles.row} onPress={handleProfile} activeOpacity={0.7}>
                <Text style={styles.icon}>👤</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Profile</Text>
                  <Text style={styles.rowSubtext}>📧 {userEmail}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Change Password */}
              <TouchableOpacity style={styles.row} onPress={handleChangePassword} activeOpacity={0.7}>
                <Text style={styles.icon}>🔒</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Change Password</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NOTIFICATIONS Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>

            <View style={styles.card}>
              {/* Push Notifications */}
              <TouchableOpacity
                style={styles.row}
                onPress={() => setPushNotifications(!pushNotifications)}
                activeOpacity={0.7}
              >
                <Text style={styles.icon}>🔔</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Push Notifications</Text>
                </View>
                <Text style={styles.toggle}>[{pushNotifications ? 'ON' : 'OFF'}]</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Daily Reminder Time */}
              <TouchableOpacity style={styles.row} onPress={handleDailyReminderTime} activeOpacity={0.7}>
                <Text style={styles.icon}>⏰</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Daily Reminder Time</Text>
                </View>
                <Text style={styles.timeValue}>{dailyReminderTime}</Text>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Streak Celebrations */}
              <TouchableOpacity
                style={styles.row}
                onPress={() => setStreakCelebrations(!streakCelebrations)}
                activeOpacity={0.7}
              >
                <Text style={styles.icon}>🎉</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Streak Celebrations</Text>
                </View>
                <Text style={styles.toggle}>[{streakCelebrations ? 'ON' : 'OFF'}]</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* GARDEN Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>GARDEN</Text>

            <View style={styles.card}>
              {/* Garden Theme */}
              <TouchableOpacity style={styles.row} onPress={handleGardenTheme} activeOpacity={0.7}>
                <Text style={styles.icon}>🎨</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Garden Theme</Text>
                </View>
                <Text style={styles.themeValue}>{gardenTheme}</Text>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Friend Limit */}
              <View style={styles.row}>
                <Text style={styles.icon}>📏</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Friend Limit</Text>
                </View>
                <Text style={styles.limitValue}>{friendLimit.current}/{friendLimit.max}</Text>
              </View>
            </View>
          </View>

          {/* Spacer before logout button */}
          <View style={styles.bottomSpacer} />

          {/* LOGOUT Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    backgroundColor: Colors.warmBeige,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#6B4423',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#6B4423',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 44,
  },
  divider: {
    height: 3,
    backgroundColor: '#8B6F47',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: '#A0826D',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B6F47',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  icon: {
    fontSize: 20,
    width: 24,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#6B4423',
  },
  rowSubtext: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: '#A0826D',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#6B4423',
  },
  toggle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6B4423',
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6B4423',
    marginRight: 4,
  },
  themeValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6B4423',
    marginRight: 4,
  },
  limitValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6B4423',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E8C9A0',
    marginHorizontal: 12,
  },
  bottomSpacer: {
    height: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#D32F2F',
    gap: 8,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#D32F2F',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
