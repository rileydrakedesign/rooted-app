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
import { useGarden } from '../contexts/GardenContext';
import { useAuth } from '../contexts/AuthContext';
import { ScreenHeader, PixelCard, PixelIcon, PixelIconName } from '../components';
import {
  NotificationPrefs,
  requestNotificationPermission,
} from '../lib/notifications';
import { requestCalendarPermission } from '../lib/calendarScan';
import { GARDEN_MAPS } from '../data/maps';

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

// Digest hours the row cycles through on tap (24 h clock).
const DIGEST_HOURS = [7, 8, 9, 10, 12, 18];

function formatHour(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function SettingsScreen({ navigation }: Props) {
  const {
    gardenPaused,
    setGardenPaused,
    notificationPrefs,
    setNotificationPrefs,
    gardenTheme,
    setGardenTheme,
    availableThemes,
  } = useGarden();
  const { user, signOut } = useAuth();
  const [pauseSaving, setPauseSaving] = useState(false);

  // Cycle through equippable themes (free default + owned skus, Batch 12).
  const cycleGardenTheme = async () => {
    const idx = availableThemes.indexOf(gardenTheme);
    const next = availableThemes[(idx + 1) % availableThemes.length];
    if (!next || next === gardenTheme) {
      Alert.alert('Garden Themes', 'More themes are waiting in the shop.');
      return;
    }
    try {
      await setGardenTheme(next);
    } catch (error: any) {
      Alert.alert('Could Not Update', error?.message ?? 'Please try again.');
    }
  };
  // Display-only placeholder — nothing enforces this cap yet (enforcement
  // lands with real persistence). Framed as "close friends" (intimacy),
  // not scarcity.
  const [friendLimit] = useState({ current: 12, max: 30 });
  const userEmail = user?.email ?? '';

  const comingSoon = (feature: string) => () => {
    Alert.alert(feature, `${feature} coming soon`);
  };

  /**
   * Flip one pref. Turning a notification category on asks for the OS
   * permission (once); turning calendar suggestions on asks for calendar
   * access. Failures surface, and the toggle reverts via the context.
   */
  const togglePref = async (key: keyof NotificationPrefs) => {
    const next = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    try {
      if (next[key] === true) {
        if (key === 'suggested') {
          const ok = await requestCalendarPermission();
          if (!ok) {
            Alert.alert(
              'Calendar Access Needed',
              'Rooted needs calendar access to suggest hangout logs. You can enable it in iOS Settings.'
            );
            return;
          }
        } else {
          await requestNotificationPermission();
        }
      }
      await setNotificationPrefs(next);
    } catch (error: any) {
      Alert.alert('Could Not Update', error?.message ?? 'Please try again.');
    }
  };

  const cycleDigestHour = async () => {
    const idx = DIGEST_HOURS.indexOf(notificationPrefs.digestHour);
    const nextHour = DIGEST_HOURS[(idx + 1) % DIGEST_HOURS.length];
    try {
      await setNotificationPrefs({ ...notificationPrefs, digestHour: nextHour });
    } catch (error: any) {
      Alert.alert('Could Not Update', error?.message ?? 'Please try again.');
    }
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
            // when the session goes null; no navigation needed here.
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Logout Failed', error?.message ?? 'Please try again.');
            }
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

          {/* NOTIFICATIONS Section — wired to users.notification_prefs (Batch 8) */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
            <PixelCard>
              <SettingsRow
                icon="sun"
                label="Morning Digest"
                subtext="One gentle summary of your garden"
                onPress={() => togglePref('digest')}
                right={toggle(notificationPrefs.digest)}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="clock"
                label="Digest Time"
                onPress={cycleDigestHour}
                right={
                  <Text style={styles.rowValue}>
                    {formatHour(notificationPrefs.digestHour)}
                  </Text>
                }
                showChevron
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="bolt"
                label="Streak Alerts"
                subtext="A nudge before a streak window closes"
                onPress={() => togglePref('atRisk')}
                right={toggle(notificationPrefs.atRisk)}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="water"
                label="Thirsty Plant Alerts"
                subtext="When a plant is about to wilt"
                onPress={() => togglePref('wilt')}
                right={toggle(notificationPrefs.wilt)}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="calendar"
                label="Calendar Suggestions"
                subtext="Spot hangouts on your calendar, log in one tap"
                onPress={() => togglePref('suggested')}
                right={toggle(notificationPrefs.suggested)}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="star"
                label="Birthday Reminders"
                onPress={() => togglePref('birthdays')}
                right={toggle(notificationPrefs.birthdays)}
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
                subtext={
                  availableThemes.length > 1 ? 'Tap to switch' : 'More themes in the shop'
                }
                onPress={cycleGardenTheme}
                right={
                  <Text style={styles.rowValue}>
                    {GARDEN_MAPS[gardenTheme]?.displayName ?? gardenTheme}
                  </Text>
                }
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
                icon="calendar"
                label="Almanac"
                subtext="Your year in the garden"
                onPress={() => navigation.navigate('Almanac')}
                showChevron
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="star"
                label="Garden Pass"
                subtext="More room, every photo kept, deep Almanac"
                onPress={() => navigation.navigate('GardenPass')}
                showChevron
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon="users"
                label="Redeem Invite Code"
                subtext="A friend planted you in their garden?"
                onPress={() => navigation.navigate('AcceptInvite')}
                showChevron
              />
              <View style={styles.rowDivider} />
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
