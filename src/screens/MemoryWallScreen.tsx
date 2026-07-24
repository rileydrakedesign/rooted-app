/**
 * Memory Wall (Batch 11, spec §6) — the archive of one friendship: the
 * chronological photo wall, the journal (notes, dates, gift ideas,
 * milestones), and the birthday. Private by default; sharing individual
 * photos arrives with linking (Batch 14) via the is_shared flag.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { ScreenHeader, PixelCard, PixelIcon } from '../components';
import {
  JournalEntry,
  JournalKind,
  WallPhoto,
  FREE_PHOTO_CAP,
  fetchJournal,
  addJournalEntry,
  deleteJournalEntry,
  fetchPhotoWall,
  pickAndUploadPhoto,
  deletePhoto,
  setFriendBirthday,
  setPhotoShared,
} from '../lib/memories';
import { useGarden } from '../contexts/GardenContext';
import { SharedWallPhoto, fetchSharedWall } from '../lib/nudges';
import CapsuleSection from '../components/CapsuleSection';

type Props = MainStackScreenProps<'MemoryWall'>;

const KIND_LABELS: Record<JournalKind, string> = {
  note: 'NOTE',
  date: 'DATE',
  gift_idea: 'GIFT IDEA',
  milestone: 'MILESTONE',
};

export default function MemoryWallScreen({ navigation, route }: Props) {
  const { friendId } = route.params;
  const { user } = useAuth();
  const { getFriendById } = useFriends();
  const friend = getFriendById(friendId);
  const { plants } = useGarden();
  const linkId = plants.find((p) => p.id === friendId)?.linkId ?? null;
  const [sharedWall, setSharedWall] = useState<SharedWallPhoto[]>([]);

  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteKind, setNoteKind] = useState<JournalKind>('note');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    fetchJournal(friendId).then(setJournal).catch(() => {});
    fetchPhotoWall(friendId).then(setPhotos).catch(() => {});
    if (linkId) fetchSharedWall(linkId).then(setSharedWall).catch(() => {});
  }, [friendId, linkId]);

  useEffect(reload, [reload]);

  const handleAddNote = async () => {
    if (!user || !noteDraft.trim()) return;
    try {
      const entry = await addJournalEntry({
        userId: user.id,
        friendId,
        kind: noteKind,
        body: noteDraft.trim(),
      });
      setJournal((prev) => [entry, ...prev]);
      setNoteDraft('');
    } catch (error: any) {
      Alert.alert('Could Not Save', error?.message ?? 'Please try again.');
    }
  };

  const handleAddPhoto = async () => {
    if (!user || busy) return;
    if (photos.length >= FREE_PHOTO_CAP) {
      // Soft cap until Batch 17 makes it an entitlement — count and warn.
      Alert.alert(
        'Wall Is Full (for now)',
        `This wall holds ${FREE_PHOTO_CAP} photos on the free plan. Garden Pass will make it unlimited.`
      );
      return;
    }
    setBusy(true);
    try {
      const row = await pickAndUploadPhoto({ userId: user.id, friendId });
      if (row) reload();
    } catch (error: any) {
      Alert.alert('Could Not Upload', error?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Tap toggles a photo onto/off the shared wall (linked only; spec §6 —
  // only the photos you explicitly choose to share).
  const handleToggleShared = async (photo: WallPhoto) => {
    const next = !photo.row.is_shared;
    try {
      await setPhotoShared(photo.row.id, next);
      setPhotos((prev) =>
        prev.map((p) =>
          p.row.id === photo.row.id ? { ...p, row: { ...p.row, is_shared: next } } : p
        )
      );
      if (linkId) fetchSharedWall(linkId).then(setSharedWall).catch(() => {});
    } catch (error: any) {
      Alert.alert('Could Not Update', error?.message ?? 'Please try again.');
    }
  };

  const handleDeletePhoto = (photo: WallPhoto) => {
    Alert.alert('Remove Photo', 'Remove this memory from the wall?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(photo.row);
            setPhotos((prev) => prev.filter((p) => p.row.id !== photo.row.id));
          } catch (error: any) {
            Alert.alert('Could Not Remove', error?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleSetBirthday = () => {
    // Minimal text-input capture (a date picker rides a later polish pass).
    Alert.prompt?.(
      'Birthday',
      `${friend?.friendName}'s birthday (MM-DD or YYYY-MM-DD)`,
      async (value) => {
        if (!value) return;
        const normalized = /^\d{2}-\d{2}$/.test(value) ? `1904-${value}` : value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
          Alert.alert('Hmm', 'Use MM-DD or YYYY-MM-DD.');
          return;
        }
        try {
          await setFriendBirthday(friendId, normalized);
          Alert.alert('Saved', 'Birthday noted — the garden will celebrate.');
        } catch (error: any) {
          Alert.alert('Could Not Save', error?.message ?? 'Please try again.');
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title={friend ? `${friend.friendName}'s Wall` : 'Memory Wall'}
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity onPress={handleSetBirthday} activeOpacity={0.7}>
              <PixelIcon name="calendar" size={20} color={Colors.textBrown} />
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Photo wall */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>PHOTOS</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddPhoto}
                disabled={busy}
                activeOpacity={0.8}
              >
                <PixelIcon name="camera" size={14} color={Colors.white} />
                <Text style={styles.addButtonText}>{busy ? '…' : 'ADD'}</Text>
              </TouchableOpacity>
            </View>
            {photos.length === 0 ? (
              <Text style={styles.emptyText}>
                Photos from your hangouts land here — unpolished and yours.
              </Text>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <TouchableOpacity
                    key={photo.row.id}
                    onPress={
                      linkId
                        ? () => handleToggleShared(photo)
                        : undefined
                    }
                    onLongPress={() => handleDeletePhoto(photo)}
                    activeOpacity={0.9}
                  >
                    {photo.url ? (
                      <Image source={{ uri: photo.url }} style={styles.photo} />
                    ) : (
                      <View style={[styles.photo, styles.photoPlaceholder]} />
                    )}
                    {photo.row.is_shared && (
                      <View style={styles.sharedBadge}>
                        <Text style={styles.sharedBadgeText}>SHARED</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Shared wall (Batch 14) — both sides' explicitly shared photos */}
          {linkId && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>SHARED WALL</Text>
              {sharedWall.length === 0 ? (
                <Text style={styles.emptyText}>
                  Tap a photo above to share it here — only what you choose,
                  and the same goes for them.
                </Text>
              ) : (
                <View style={styles.photoGrid}>
                  {sharedWall.map((photo) => (
                    <View key={photo.id}>
                      {photo.url ? (
                        <Image source={{ uri: photo.url }} style={styles.photo} />
                      ) : (
                        <View style={[styles.photo, styles.photoPlaceholder]} />
                      )}
                      <View style={styles.sharedBadge}>
                        <Text style={styles.sharedBadgeText}>
                          {photo.mine ? 'YOU' : 'THEM'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Time capsules (Batch 16) */}
          {user && (
            <CapsuleSection
              userId={user.id}
              friendId={friendId}
              friendName={friend?.friendName ?? 'your friend'}
              linkId={linkId}
            />
          )}

          {/* Journal */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>JOURNAL</Text>
            <PixelCard>
              <View style={styles.composer}>
                <View style={styles.kindRow}>
                  {(Object.keys(KIND_LABELS) as JournalKind[]).map((kind) => (
                    <TouchableOpacity
                      key={kind}
                      style={[styles.kindChip, noteKind === kind && styles.kindChipActive]}
                      onPress={() => setNoteKind(kind)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.kindChipText,
                          noteKind === kind && styles.kindChipTextActive,
                        ]}
                      >
                        {KIND_LABELS[kind]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Anything to remember?"
                  placeholderTextColor={Colors.textBrownMuted}
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.saveButton, !noteDraft.trim() && styles.saveButtonDisabled]}
                  onPress={handleAddNote}
                  disabled={!noteDraft.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </PixelCard>

            {journal.map((entry) => (
              <PixelCard key={entry.id}>
                <TouchableOpacity
                  style={styles.entryRow}
                  onLongPress={() =>
                    Alert.alert('Remove Entry', 'Delete this journal entry?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteJournalEntry(entry.id).catch(() => {});
                          setJournal((prev) => prev.filter((e) => e.id !== entry.id));
                        },
                      },
                    ])
                  }
                  activeOpacity={0.9}
                >
                  <Text style={styles.entryKind}>
                    {KIND_LABELS[entry.kind as JournalKind] ?? entry.kind.toUpperCase()}
                  </Text>
                  <Text style={styles.entryBody}>{entry.body}</Text>
                  <Text style={styles.entryDate}>
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                  </Text>
                </TouchableOpacity>
              </PixelCard>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.warmBeige },
  container: { flex: 1, backgroundColor: Colors.warmBeige },
  content: { padding: Spacing.medium, paddingBottom: 40 },
  section: { marginBottom: Spacing.large },
  sectionHeaderRow: {
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
    marginBottom: Spacing.small,
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
  emptyText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    paddingVertical: Spacing.medium,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
  },
  photo: {
    width: 104,
    height: 104,
    borderRadius: BorderRadius.small,
    borderWidth: 2,
    borderColor: Colors.pixelBorder,
  },
  photoPlaceholder: {
    backgroundColor: Colors.tanTrack,
  },
  sharedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.sageGreen,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  sharedBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  composer: {
    padding: Spacing.medium - 4,
    gap: Spacing.small,
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.tiny + 2,
  },
  kindChip: {
    borderColor: Colors.pixelBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.small,
    paddingVertical: 3,
    backgroundColor: Colors.cream,
  },
  kindChipActive: { backgroundColor: Colors.sageGreen },
  kindChipText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  kindChipTextActive: { color: Colors.white },
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
  saveButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.small,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small - 2,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  entryRow: {
    padding: Spacing.medium - 4,
    gap: 2,
  },
  entryKind: {
    fontSize: 10,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  entryBody: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
  },
  entryDate: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
});
