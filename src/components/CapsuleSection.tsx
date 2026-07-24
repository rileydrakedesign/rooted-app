/**
 * CapsuleSection (Batch 16) — the time-capsule surface on a friend's
 * memory wall: buried list (locked/unlocked), the burial flow (note, photo,
 * voice via expo-audio), and the unlock celebration. Slots are enforced by
 * the bury_capsule RPC; this UI just relays its answer.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
  AudioModule,
} from 'expo-audio';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { PixelCard, PixelIcon } from './index';
import {
  Capsule,
  CapsuleKind,
  fetchCapsules,
  buryCapsule,
  openCapsule,
  uploadVoiceMemo,
} from '../lib/capsules';
import { pickAndUploadPhoto } from '../lib/memories';

const UNLOCK_CHOICES = [
  { label: '1 MONTH', days: 30 },
  { label: '6 MONTHS', days: 182 },
  { label: '1 YEAR', days: 365 },
];

interface CapsuleSectionProps {
  userId: string;
  friendId: string;
  friendName: string;
  /** Non-null when the plant is linked — enables co-op capsules. */
  linkId: string | null;
}

export default function CapsuleSection({
  userId,
  friendId,
  friendName,
  linkId,
}: CapsuleSectionProps) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [burying, setBurying] = useState(false);
  const [kind, setKind] = useState<CapsuleKind>('note');
  const [note, setNote] = useState('');
  const [unlockDays, setUnlockDays] = useState(182);
  const [shared, setShared] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(playUrl ? { uri: playUrl } : null);

  const reload = useCallback(() => {
    fetchCapsules(friendId).then(setCapsules).catch(() => {});
  }, [friendId]);
  useEffect(reload, [reload]);

  const toggleRecording = async () => {
    try {
      if (recording) {
        await recorder.stop();
        setVoiceUri(recorder.uri ?? null);
        setRecording(false);
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Microphone Needed', 'Voice capsules need microphone access.');
          return;
        }
        await recorder.prepareToRecordAsync();
        recorder.record();
        setRecording(true);
      }
    } catch (e: any) {
      setRecording(false);
      Alert.alert('Recording Problem', e?.message ?? 'Please try again.');
    }
  };

  const handleBury = async () => {
    try {
      const unlockAt = new Date(Date.now() + unlockDays * 86_400_000).toISOString();
      let storagePath: string | undefined;
      if (kind === 'photo') {
        const row = await pickAndUploadPhoto({ userId, friendId });
        if (!row) return;
        storagePath = row.storage_path;
      } else if (kind === 'voice') {
        if (!voiceUri) {
          Alert.alert('Nothing Recorded', 'Record a voice memo first.');
          return;
        }
        storagePath = await uploadVoiceMemo(userId, friendId, voiceUri);
      } else if (!note.trim()) {
        return;
      }
      await buryCapsule({
        friendId,
        kind,
        unlockAt,
        body: kind === 'note' ? note.trim() : undefined,
        storagePath,
        shared: shared && linkId !== null,
      });
      setNote('');
      setVoiceUri(null);
      setBurying(false);
      reload();
      Alert.alert(
        'Buried',
        `It's safe in ${friendName}'s plant until ${new Date(unlockAt).toLocaleDateString()}.`
      );
    } catch (error: any) {
      Alert.alert('Could Not Bury', error?.message ?? 'Please try again.');
    }
  };

  const handleOpen = async (capsule: Capsule) => {
    if (!capsule.unlocked) {
      Alert.alert(
        'Still Buried',
        `This one opens ${new Date(capsule.row.unlock_at).toLocaleDateString()}. Worth the wait.`
      );
      return;
    }
    try {
      const { mediaUrl } = await openCapsule(capsule.row);
      if (capsule.row.kind === 'note') {
        Alert.alert(`From ${new Date(capsule.row.created_at).toLocaleDateString()}`, capsule.row.body ?? '');
      } else if (capsule.row.kind === 'voice' && mediaUrl) {
        setPlayUrl(mediaUrl);
        setTimeout(() => player.play(), 300);
        Alert.alert('A Voice From Then', 'Playing your buried memo…');
      } else if (mediaUrl) {
        Alert.alert('A Photo From Then', 'It moved to the photo wall — take a look.');
      }
      reload();
    } catch (error: any) {
      Alert.alert('Could Not Open', error?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>TIME CAPSULES</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setBurying((b) => !b)}
          activeOpacity={0.8}
        >
          <PixelIcon name="clock" size={14} color={Colors.white} />
          <Text style={styles.addButtonText}>{burying ? 'CLOSE' : 'BURY ONE'}</Text>
        </TouchableOpacity>
      </View>

      {burying && (
        <PixelCard>
          <View style={styles.form}>
            <View style={styles.chipRow}>
              {(['note', 'photo', 'voice'] as CapsuleKind[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.chip, kind === k && styles.chipActive]}
                  onPress={() => setKind(k)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, kind === k && styles.chipTextActive]}>
                    {k.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {kind === 'note' && (
              <TextInput
                style={styles.noteInput}
                placeholder={`Something for future you (and ${friendName})…`}
                placeholderTextColor={Colors.textBrownMuted}
                value={note}
                onChangeText={setNote}
                multiline
              />
            )}
            {kind === 'voice' && (
              <TouchableOpacity
                style={[styles.chip, recording && styles.chipRecording]}
                onPress={toggleRecording}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>
                  {recording ? 'STOP RECORDING' : voiceUri ? 'RE-RECORD' : 'START RECORDING'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.chipRow}>
              {UNLOCK_CHOICES.map((c) => (
                <TouchableOpacity
                  key={c.days}
                  style={[styles.chip, unlockDays === c.days && styles.chipActive]}
                  onPress={() => setUnlockDays(c.days)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, unlockDays === c.days && styles.chipTextActive]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {linkId && (
              <TouchableOpacity
                style={[styles.chip, shared && styles.chipActive]}
                onPress={() => setShared((sh) => !sh)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, shared && styles.chipTextActive]}>
                  {shared ? 'BURYING TOGETHER' : 'BURY TOGETHER?'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.buryButton} onPress={handleBury} activeOpacity={0.8}>
              <Text style={styles.buryButtonText}>BURY IT</Text>
            </TouchableOpacity>
          </View>
        </PixelCard>
      )}

      {capsules.length === 0 && !burying ? (
        <Text style={styles.emptyText}>
          Bury a note, photo, or voice memo — it stays sealed until the day you choose.
        </Text>
      ) : (
        capsules.map((capsule) => (
          <PixelCard key={capsule.row.id}>
            <TouchableOpacity
              style={styles.capsuleRow}
              onPress={() => handleOpen(capsule)}
              activeOpacity={0.8}
            >
              <PixelIcon
                name={capsule.unlocked ? 'check-circle' : 'lock'}
                size={18}
                color={capsule.unlocked ? Colors.success : Colors.textBrownMuted}
              />
              <View style={styles.capsuleInfo}>
                <Text style={styles.capsuleTitle}>
                  {capsule.row.kind.toUpperCase()}
                  {capsule.row.link_id ? ' · TOGETHER' : ''}
                  {capsule.row.opened_at ? ' · OPENED' : ''}
                </Text>
                <Text style={styles.capsuleDate}>
                  {capsule.unlocked
                    ? 'Ready to open'
                    : `Opens ${new Date(capsule.row.unlock_at).toLocaleDateString()}`}
                </Text>
              </View>
            </TouchableOpacity>
          </PixelCard>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.large },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.small,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.small,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  form: { padding: Spacing.medium - 4, gap: Spacing.small },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.tiny + 2 },
  chip: {
    borderColor: Colors.pixelBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    backgroundColor: Colors.cream,
    alignSelf: 'flex-start',
  },
  chipActive: { backgroundColor: Colors.sageGreen },
  chipRecording: { backgroundColor: Colors.notificationOrange },
  chipText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  chipTextActive: { color: Colors.white },
  noteInput: {
    minHeight: 60,
    borderColor: Colors.dividerTan,
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    padding: Spacing.small,
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    textAlignVertical: 'top',
  },
  buryButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.small,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small - 2,
  },
  buryButtonText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    paddingVertical: Spacing.medium,
  },
  capsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    padding: Spacing.medium - 4,
  },
  capsuleInfo: { flex: 1 },
  capsuleTitle: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  capsuleDate: {
    fontSize: 12,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
});
