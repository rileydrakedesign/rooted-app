import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Plant } from './PlantTile';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PlantInfoPanelProps {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
  onCall?: () => void;
  onText?: () => void;
  onLogInteraction?: () => void;
  onEditFriend?: () => void;
}

export default function PlantInfoPanel({
  visible,
  plant,
  onClose,
  onCall,
  onText,
  onLogInteraction,
  onEditFriend,
}: PlantInfoPanelProps) {
  if (!plant) return null;

  // Calculate days until needs water based on hydration
  const daysUntilWater = Math.ceil((plant.hydration / 100) * 7);

  // Mock data for demo
  const lastContact = '2 days ago';
  const contactFrequency = 'Weekly';
  const hasStreak = plant.hydration > 70;
  const streakDays = 7;

  // Determine hydration bar color
  const getHydrationColor = (hydration: number) => {
    if (hydration >= 60) return '#4CAF50'; // Green
    if (hydration >= 20) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Panel */}
        <View style={styles.panel}>
          {/* Swipe Handle */}
          <View style={styles.handleBar} />

          {/* Content */}
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              {/* Plant Sprite */}
              <View style={styles.plantSpriteContainer}>
                <Text style={styles.plantSprite}>🌵</Text>
              </View>

              {/* Friend Info */}
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{plant.friendName.toUpperCase()}</Text>
                <Text style={styles.plantDetails}>
                  {plant.plantType.charAt(0).toUpperCase() + plant.plantType.slice(1)} • Stage {plant.stage}
                </Text>
                {hasStreak && (
                  <Text style={styles.streakBadge}>⚡ {streakDays}-day streak!</Text>
                )}
              </View>
            </View>

            {/* Hydration Bar */}
            <View style={styles.hydrationContainer}>
              <View style={styles.hydrationBarBg}>
                <View
                  style={[
                    styles.hydrationBarFill,
                    {
                      width: `${plant.hydration}%`,
                      backgroundColor: getHydrationColor(plant.hydration),
                    },
                  ]}
                >
                  <Text style={styles.hydrationText}>{plant.hydration}%</Text>
                </View>
              </View>
            </View>

            {/* Info Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statText}>Last Contact: {lastContact}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statIcon}>🌱</Text>
                <Text style={styles.statText}>Needs Water In: {daysUntilWater} days</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statIcon}>📞</Text>
                <Text style={styles.statText}>Contact Frequency: {contactFrequency}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {/* Call and Text Buttons (Side by Side) */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf]}
                  onPress={onCall}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonIcon}>📞</Text>
                  <Text style={styles.buttonText}>CALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonHalf]}
                  onPress={onText}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonIcon}>💬</Text>
                  <Text style={styles.buttonText}>TEXT</Text>
                </TouchableOpacity>
              </View>

              {/* Log Interaction Button */}
              <TouchableOpacity
                style={[styles.button, styles.buttonFull]}
                onPress={onLogInteraction}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>✏️</Text>
                <Text style={styles.buttonText}>LOG INTERACTION</Text>
              </TouchableOpacity>

              {/* Edit Friend Button */}
              <TouchableOpacity
                style={[styles.button, styles.buttonFull]}
                onPress={onEditFriend}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>⚙️</Text>
                <Text style={styles.buttonText}>EDIT FRIEND</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  panel: {
    backgroundColor: '#F5E6D3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#8B6F47',
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: 40,
  },
  handleBar: {
    width: 120,
    height: 5,
    backgroundColor: '#8B6F47',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  plantSpriteContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B6F47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantSprite: {
    fontSize: 64,
  },
  friendInfo: {
    flex: 1,
    paddingTop: 8,
  },
  friendName: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: '#6B4423',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  plantDetails: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#A0826D',
    marginBottom: 8,
  },
  streakBadge: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FF9800',
  },
  hydrationContainer: {
    marginBottom: 24,
  },
  hydrationBarBg: {
    height: 48,
    backgroundColor: '#DEB887',
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B6F47',
    overflow: 'hidden',
  },
  hydrationBarFill: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  hydrationText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    fontSize: 20,
    width: 24,
  },
  statText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#6B4423',
  },
  actionsContainer: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8916B',
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B6F47',
    gap: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    width: '100%',
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
