import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, ComponentSizes, Spacing } from '../../constants/theme';
import { Fonts, FontSizes } from '../../constants/fonts';

interface TopBarProps {
  gardenName?: string;
  notificationCount?: number;
  onMenuPress: () => void;
  onAddFriendPress: () => void;
  onSettingsPress: () => void;
  onNotificationPress: () => void;
}

export default function TopBar({
  gardenName = 'My Garden',
  notificationCount = 0,
  onMenuPress,
  onAddFriendPress,
  onSettingsPress,
  onNotificationPress,
}: TopBarProps) {
  return (
    <View style={styles.container}>
      {/* Left: Menu Button */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Center: Garden Title (absolutely positioned) */}
      <View style={styles.centerSection}>
        <Text style={styles.title}>{gardenName}</Text>
      </View>

      {/* Right: Action Buttons */}
      <View style={styles.rightSection}>
        {/* Add Friend Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.addButton]}
          onPress={onAddFriendPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>+</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>⚙</Text>
        </TouchableOpacity>

        {/* Notification Button with Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>🔔</Text>
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ComponentSizes.topBarHeight,
    backgroundColor: Colors.warmBeige,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    // Semi-transparent overlay effect
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // Allow touches to pass through to buttons below
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.small,
  },
  title: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.pixel,
    color: Colors.forestGreen,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  iconButton: {
    width: ComponentSizes.iconMedium,
    height: ComponentSizes.iconMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  addButton: {
    backgroundColor: Colors.sageGreen,
    borderWidth: 2,
    borderColor: Colors.forestGreen,
  },
  icon: {
    fontSize: 20,
    color: Colors.forestGreen,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.notificationOrange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Fonts.pixel,
    color: Colors.white,
    fontWeight: 'bold',
  },
});
