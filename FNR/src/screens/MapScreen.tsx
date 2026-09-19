import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import { AppColors } from '../theme/colors';

const MAP_EMBED_URL = 'https://www.google.com/maps/d/embed?mid=17UmWFgWahEs8KFgClfjU6TjRBpgLOUc&ehbc=2E312F';
const MAP_VIEWER_URL = 'https://www.google.com/maps/d/u/0/viewer?mid=17UmWFgWahEs8KFgClfjU6TjRBpgLOUc';

export default function MapScreen() {
  const theme = useTheme();
  const appColors = theme.colors as unknown as AppColors;
  const styles = useMemo(() => getMapStyles(appColors), [appColors]);

  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // show loading while checking network status
  if (isConnected === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={appColors.primary} />
        <Text style={{ color: appColors.text }}>Checking for network...</Text>
      </View>
    );
  }

  // if online, show map
  return (
    <View style={styles.container}>
    {isConnected ? (
      <>
        <WebView
          source={{ uri: MAP_EMBED_URL }}
          style={styles.container}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        <Button style={styles.mapsBtn} onPress={() => Linking.openURL(MAP_VIEWER_URL)} icon="open-in-new" textColor={appColors.primary}>
          Open in Google Maps
        </Button>
      </>
    ) : (
      // if offline, show message with link to open in google maps
      <View style={styles.offlineContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.paragraph}>Offline or unable to load the map. You can open the map when online using the link below:</Text>
          </Card.Content>
        </Card>
        <Button style={styles.mapsBtn} onPress={() => Linking.openURL(MAP_VIEWER_URL)} icon="open-in-new" textColor={appColors.primary}>
          Open in Google Maps
        </Button>
      </View>
  )}
  </View>
);
}

const getMapStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  offlineContainer: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, width: '100%', marginBottom: 20 },
  paragraph: { textAlign: 'center', marginBottom: 12, color: colors.text },
  mapsBtn: { alignSelf: 'center', margin: 10 },
});
