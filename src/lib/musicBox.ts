/**
 * Music Box (Batch 18, spec §4 songs — previews-only v1, default #17).
 * No MusicKit and no native module: song search + 30-second previews come
 * from the public iTunes Search API, playback via expo-audio, delivery
 * over the nudge channel ('song' type). Full Apple Music / Spotify
 * playback is a later spike (custom Swift module).
 */

import { createAudioPlayer } from 'expo-audio';
import { supabase } from './supabase';
import { sendPartnerPush } from './links';

export interface SongResult {
  title: string;
  artist: string;
  previewUrl: string;
  artworkUrl: string | null;
}

export async function searchSongs(query: string, limit = 3): Promise<SongResult[]> {
  const url =
    'https://itunes.apple.com/search?media=music&entity=song&limit=' +
    limit +
    '&term=' +
    encodeURIComponent(query);
  const response = await fetch(url);
  const json = (await response.json()) as {
    results?: { trackName?: string; artistName?: string; previewUrl?: string; artworkUrl100?: string }[];
  };
  return (json.results ?? [])
    .filter((r) => r.previewUrl)
    .map((r) => ({
      title: r.trackName ?? 'Untitled',
      artist: r.artistName ?? 'Unknown',
      previewUrl: r.previewUrl as string,
      artworkUrl: r.artworkUrl100 ?? null,
    }));
}

/** Send a song to a linked plant: their plant sways while it plays. */
export async function sendSong(params: {
  linkId: string;
  song: SongResult;
  message?: string;
  senderName?: string;
}): Promise<void> {
  const { data, error } = await supabase.rpc('send_nudge', {
    p_link_id: params.linkId,
    p_type: 'song',
    p_payload: {
      v: 1,
      song: {
        title: params.song.title,
        artist: params.song.artist,
        previewUrl: params.song.previewUrl,
        artworkUrl: params.song.artworkUrl,
      },
      note: params.message ?? null,
    },
  });
  if (error) throw error;
  const r = data as { recipient_user_id: string };
  sendPartnerPush(
    r.recipient_user_id,
    'A song landed on your plant',
    `${params.senderName ?? 'A friend'} sent "${params.song.title}" — ${params.song.artist}.`,
    { url: 'rooted://friends' }
  );
}

let activePlayer: ReturnType<typeof createAudioPlayer> | null = null;

/** Play a 30s preview (stops any prior one). Safe to call fire-and-forget. */
export function playPreview(previewUrl: string): void {
  try {
    if (activePlayer) {
      activePlayer.release();
      activePlayer = null;
    }
    activePlayer = createAudioPlayer({ uri: previewUrl });
    activePlayer.play();
  } catch (e) {
    if (__DEV__) console.log('[MUSICBOX] preview playback failed:', e);
  }
}
