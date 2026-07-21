import React, { useEffect, useState } from 'react';
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
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { supabase } from '../lib/supabase';
import { useGarden } from '../contexts/GardenContext';
import { ScreenHeader, PixelCard, PixelIcon, PixelIconName } from '../components';

type Props = MainTabScreenProps<'Settings'>;

interface RowProps {
  icon: PixelIconName;
  label: string;
  subtext?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}

function SettingsRow({ icon, label, subtext, onPress, right, showChevron, disabled }: RowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || !onPress}
    >
      <PixelIcon name={icon} size={20} color={Colors.textBrown} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtext != null && <Text style={styles.rowSubtext}>{subtext}</Text>}
      </View>
      {right}
      {showChevron && <PixelIcon name="angle-right" size={16} color={Colors.textBrown} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { gardenPaused, setGardenPaused } = useGarden();
  const [pauseSaving, setPauseSaving] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [streakCelebrations, setStreakCelebrations] = useState(true);
  const [dailyReminderTime] = useState('8:00 AM');
  const [gardenTheme] = useState('Cozy Greenhouse');
  // Display-only placeholder — nothing enforces this cap yet (enforcement
  // lands with real persistence). Framed as "close friends" (intimacy),
  // not scarcity.
  const [friendLimit] = useState({ current: 12, max: 30 });
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '');
    });
  }, []);

  const comingSoon = (feature: string) => () => {
    Alert.alert(feature, `${feature} coming soon`);
  };

  const handlePauseToggle = async () => {
    if (pauseSaving) return;
    setPauseSaving(true);
    try {
      await setGardenPaused(!gardenPaused);
    } catch (error: any) {
      Alert.alert('Could Not Update', error?.message ?? 'Please try again.');
    } finally {
      setPauseSaving(false);
    }
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
          onPress: async () => {
            // RootNavigator swaps to the auth stack and GardenContext clears
            // on the SIGNED_OUT event; no navigation needed here.
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Logout Failed', error.message);
          },
        },
      ]
    );
  };

  const toggle = (on: boolean, saving = false) => (
    <Text style={styles.toggle}>{saving ? '…' : `[${on ? 'ON' : 'OFF'}]`}</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title="Settings" />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* ACCOUNT Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ACCOUNT</Text>
            <PixelCard>
              <SettingsRow
                icon="user"
                label="Profile"
                subtext={userEmail || undefined}
                onPress={comingSoon('Profile')}
                showChevron
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="lock"
                label="Change Password"
                onPress={comingSoon('Change Password')}
                showChevron
              />
            </PixelCard>
          </View>

          {/* NOTIFICATIONS Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
            <PixelCard>
              <SettingsRow
                icon="bell"
                label="Push Notifications"
                onPress={() => setPushNotifications(!pushNotifications)}
                right={toggle(pushNotifications)}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="clock"
                label="Daily Reminder Time"
                onPress={comingSoon('Daily Reminder Time')}
                right={<Text style={styles.rowValue}>{dailyReminderTime}</Text>}
                showChevron
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="star"
                label="Streak Celebrations"
                onPress={() => setStreakCelebrations(!streakCelebrations)}
                right={toggle(streakCelebrations)}
              />
            </PixelCard>
          </View>

          {/* GARDEN Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>GARDEN</Text>
            <PixelCard>
              <SettingsRow
                icon="paint-brush"
                label="Garden Theme"
                onPress={comingSoon('Garden Theme')}
                right={<Text style={styles.rowValue}>{gardenTheme}</Text>}
                showChevron
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="sun"
                label="Pause Garden"
                subtext={
                  gardenPaused
                    ? 'Plants are frozen — no thirst while you are away'
                    : 'Freeze thirst while on vacation'
                }
                onPress={handlePauseToggle}
                disabled={pauseSaving}
                right={toggle(gardenPaused, pauseSaving)}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="users"
                label="Close Friends"
                subtext="Room in your garden"
                right={
                  <Text style={styles.rowValue}>
                    {friendLimit.current}/{friendLimit.max}
                  </Text>
                }
              />
            </PixelCard>
          </View>

          {/* SUPPORT Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>SUPPORT</Text>
            <PixelCard>
              <SettingsRow
                icon="question-circle"
                label="Help & Feedback"
                onPress={() => navigation.navigate('Help')}
                showChevron
              />
            </PixelCard>
          </View>

          <View style={styles.bottomSpacer} />

          {/* LOGOUT Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <PixelIcon name="logout" size={20} color={Colors.danger} />
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.medium,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing.medium + 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium - 4,
    gap: Spacing.small + 2,
    minHeight: 44,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  rowSubtext: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    marginRight: 4,
  },
  toggle: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.dividerTan,
    marginHorizontal: Spacing.medium - 4,
  },
  bottomSpacer: {
    height: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent,
    paddingVertical: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 3,
    borderColor: Colors.danger,
    gap: Spacing.small,
  },
  logoutText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.danger,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
