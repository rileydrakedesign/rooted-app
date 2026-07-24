/**
 * NotificationGate — invisible component mounted inside the providers that
 * owns everything reactive about notifications:
 *  - handler + iOS category registration at startup
 *  - responding to notification actions: "Already did" logs the interaction
 *    without opening the app UI; Call/Text jump straight to the dialer or
 *    Messages; a plain tap deep-links to the plant (rooted://plant/<id>).
 */

import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useGarden } from '../contexts/GardenContext';
import {
  configureNotificationHandling,
  registerNotificationCategories,
} from '../lib/notifications';

export default function NotificationGate() {
  const { logInteraction } = useGarden();

  useEffect(() => {
    configureNotificationHandling();
    registerNotificationCategories();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        url?: string;
        friendId?: string;
        phone?: string | null;
      };
      const action = response.actionIdentifier;

      if (action === 'already-did' && data.friendId) {
        logInteraction(data.friendId, 'manual').catch((e) =>
          console.warn('[NOTIFY] already-did log failed:', e)
        );
        return;
      }
      if (action === 'call-now' && data.phone) {
        Linking.openURL(`tel:${data.phone}`).catch(() => {});
        return;
      }
      if (action === 'text-now' && data.phone) {
        Linking.openURL(`sms:${data.phone}`).catch(() => {});
        return;
      }
      // Default tap → deep link into the app (plant panel / friends list).
      if (data.url) {
        Linking.openURL(data.url).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [logInteraction]);

  return null;
}
