import React from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Shared modal bottom sheet: dimmed backdrop (tap to dismiss), cream panel
 * with pixel border and drag handle. All selectors/popups build on this.
 */
export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.panel, { maxHeight: height * 0.85 }]}>
          <View style={styles.handleBar} />
          {children}
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
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: Colors.pixelBorder,
    paddingBottom: 40,
  },
  handleBar: {
    width: 120,
    height: 5,
    backgroundColor: Colors.pixelBorder,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 3,
  },
});
