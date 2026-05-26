import React, { useEffect, useRef } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'SosTriggered'>;

export function SosTriggeredScreen({ route, navigation }: Props): React.JSX.Element {
  const { event, sosMessage } = route.params;
  const { colors } = useTheme();

  const lat = event.latitude ?? (event as any).lat ?? 0;
  const lon = event.longitude ?? (event as any).lon ?? 0;

  // Flashing animation for emergency background
  const flashAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Prevent going back via hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onHome();
      return true;
    });

    // Flash background animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      backHandler.remove();
    };
  }, [flashAnim]);

  const onHome = () => {
    try {
      navigation.popToTop();
    } catch {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#09090C' }]}>
      {/* Red flashing ambient glow */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#D32F2F', opacity: flashAnim }]} />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.alertIconBadge, { backgroundColor: colors.emergency }]}>
            <Ionicons name="megaphone" size={40} color="#FFFFFF" />
          </View>
          <Text style={[textStyles.displayMedium, styles.title]}>
            SOS Dispatched
          </Text>
          <View style={styles.dispatchBadge}>
            <View style={styles.dispatchDot} />
            <Text style={styles.dispatchBadgeText}>LIVE ALERT ACTIVE</Text>
          </View>
          <Text style={[textStyles.bodyLarge, styles.subtitle]}>
            Emergency alerts have been sent to your primary contacts and public safety.
          </Text>
        </View>

        {/* Message and Status Panel */}
        <View style={[styles.statusCard, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <View style={styles.statusRow}>
            <Ionicons name="chatbox-ellipses" size={24} color={colors.emergency} />
            <Text style={[textStyles.bodyMedium, styles.statusText, { color: '#FFFFFF' }]}>
              {sosMessage ?? 'Dialer to 112 was opened and custom emergency SMS coordinates were sent successfully.'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.coordRow}>
            <Ionicons name="location" size={20} color="rgba(255,255,255,0.5)" />
            <View style={styles.coordTexts}>
              <Text style={styles.coordLabel}>DISPATCH GPS COORDINATES</Text>
              <Text style={styles.coordValue}>
                {lat.toFixed(6)}°, {lon.toFixed(6)}°
              </Text>
            </View>
          </View>
        </View>

        {/* Safe Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.homeBtn,
              { backgroundColor: '#FFFFFF', opacity: pressed ? 0.9 : 1.0 }
            ]}
            onPress={onHome}
            accessibilityRole="button"
            accessibilityLabel="Return to home"
          >
            <Ionicons name="home" size={20} color="#000000" style={{ marginRight: spacing[2] }} />
            <Text style={styles.homeBtnText}>RETURN TO HOME</Text>
          </Pressable>
          <Text style={styles.footerNote}>
            Road-SOS continues monitoring in background. Ride safe.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  alertIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  dispatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(239,68,68,0.16)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    marginBottom: spacing[3],
  },
  dispatchDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: spacing[2],
  },
  dispatchBadgeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  statusCard: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginVertical: spacing[6],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statusText: {
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing[3],
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  coordTexts: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Courier',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[4],
  },
  homeBtn: {
    width: '100%',
    height: 64,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  homeBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerNote: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
  },
});
