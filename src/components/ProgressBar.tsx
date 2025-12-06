import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  background: {
    height: 12,
    backgroundColor: '#DEB887',
    borderRadius: 8,
    borderWidth: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderTopColor: '#E8C9A0',
    borderLeftColor: '#E8C9A0',
    borderRightColor: '#8B6F47',
    borderBottomColor: '#8B6F47',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 3,
  },
  fill: {
    height: '100%',
    backgroundColor: '#8B6F47',
    borderRadius: 6,
  },
});
