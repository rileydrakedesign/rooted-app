import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, ComponentSizes, Spacing } from '../../constants/theme';
import { Fonts, FontSizes } from '../../constants/fonts';
import PixelIcon from '../PixelIcon';

interface TopBarProps {
  gardenName?: string;
  notificationCount?: number;
  onAddFriendPress: () => void;
  onNotificationPress: () => void;
  onSharePress?: () => void;
}

/**
 * Garden-contextual action bar. Top-level navigation lives in the bottom tab
 * bar — this holds only actions that act on the garden itself.
 */
export default function TopBar({
  gardenName = 'My Garden',
  notificationCount = 0,
  onAddFriendPress,
  onNotificationPress,
  onSharePress,
}: TopBarProps) {
  return (
    <View style={styles.container}>
      {/* Left: Share */}
      <View style={styles.leftSection}>
        {onSharePress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSharePress}
            activeOpacity={0.7}
          >
            <PixelIcon name="camera" size={22} />
          </TouchableOpacity>
        )}
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
          <PixelIcon name="plus" size={18} />
        </TouchableOpacity>

        {/* Notification Button with Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <PixelIcon name="bell" size={22} />
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
    alignItems: 'center',
    gap: Spacing.small,
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  addButton: {
    backgroundColor: Colors.sageGreen,
    borderWidth: 2,
    borderColor: Colors.forestGreen,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
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
