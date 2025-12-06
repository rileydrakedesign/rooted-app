import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.arrow}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B8916B',
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: '#D4A574',
    borderLeftColor: '#D4A574',
    borderRightColor: '#8B6F47',
    borderBottomColor: '#8B6F47',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 6,
  },
  arrow: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
