import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface CalibrationPoint {
  gridX: number;
  gridY: number;
  screenX: number;
  screenY: number;
}

/**
 * Interactive tool to calibrate grid positions by tapping
 * Tap on each grid intersection in order to record exact coordinates
 */
export default function GridCalibrationTool() {
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [currentGrid, setCurrentGrid] = useState({ x: 0, y: 0 });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const newPoint: CalibrationPoint = {
        gridX: currentGrid.x,
        gridY: currentGrid.y,
        screenX: Math.round(event.x),
        screenY: Math.round(event.y),
      };

      setPoints([...points, newPoint]);

      // Move to next grid position
      let nextX = currentGrid.x + 1;
      let nextY = currentGrid.y;
      if (nextX >= 10) {
        nextX = 0;
        nextY = currentGrid.y + 1;
      }
      setCurrentGrid({ x: nextX, y: nextY });
    });

  const handleExport = () => {
    // Generate the POSITION_MAP code
    let code = 'const POSITION_MAP: Record<string, { x: number; y: number }> = {\n';

    // Calculate offsets from center
    const centerX = points.find(p => p.gridX === 5 && p.gridY === 5);
    if (!centerX) {
      Alert.alert('Error', 'Please calibrate position 5,5 first (center)');
      return;
    }

    points.forEach(p => {
      const offsetX = p.screenX - centerX.screenX;
      const offsetY = p.screenY - centerX.screenY;
      code += `  '${p.gridX},${p.gridY}': { x: ${offsetX}, y: ${offsetY} },\n`;
    });

    code += '};';

    console.log('Generated POSITION_MAP:');
    console.log(code);
    Alert.alert('Exported', 'Check console for generated code');
  };

  const handleReset = () => {
    setPoints([]);
    setCurrentGrid({ x: 0, y: 0 });
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={styles.tapArea}>
          {/* Show recorded points */}
          {points.map((p, i) => (
            <View
              key={i}
              style={[
                styles.point,
                {
                  left: p.screenX - 4,
                  top: p.screenY - 4,
                },
              ]}
            >
              <Text style={styles.pointLabel}>{`${p.gridX},${p.gridY}`}</Text>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.instruction}>
          Tap on grid intersection: ({currentGrid.x}, {currentGrid.y})
        </Text>
        <Text style={styles.progress}>
          {points.length} / 100 points calibrated
        </Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.exportButton]}
            onPress={handleExport}
            disabled={points.length < 100}
          >
            <Text style={styles.buttonText}>Export Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tapArea: {
    flex: 1,
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
    borderWidth: 1,
    borderColor: '#fff',
  },
  pointLabel: {
    position: 'absolute',
    top: 10,
    left: -10,
    fontSize: 8,
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 10,
  },
  instruction: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
