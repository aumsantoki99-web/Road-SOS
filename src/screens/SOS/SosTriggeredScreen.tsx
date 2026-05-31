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
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Red flashing ambient glow */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.emergency, opacity: flashAnim }]} />
      
      <LinearGradient
        colors={colors.bgPrimary === '#000000' || colors.bgPrimary === '#09090C' 
          ? ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)'] 
          : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.alertIconBadge, { backgroundColor: colors.emergency }]}>
            <Ionicons name="megaphone" size={40} color={colors.white} />
          </View>
          <Text style={[textStyles.displayMedium, styles.title, { color: colors.textPrimary }]}>
            SOS Dispatched
          </Text>
          <View style={[styles.dispatchBadge, { backgroundColor: `${colors.emergency}24`, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.dispatchDot, { backgroundColor: colors.emergency }]} />
            <Text style={[styles.dispatchBadgeText, { color: colors.emergency }]}>LIVE ALERT ACTIVE</Text>
          </View>
          <Text style={[textStyles.bodyLarge, styles.subtitle, { color: colors.textSecondary }]}>
            Emergency alerts have been sent to your primary contacts and public safety.
          </Text>
        </View>

        {/* Message and Status Panel */}
        <View style={[styles.statusCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}>
          <View style={styles.statusRow}>
            <Ionicons name="chatbox-ellipses" size={24} color={colors.emergency} />
            <Text style={[textStyles.bodyMedium, styles.statusText, { color: colors.textPrimary }]}>
              {sosMessage ?? 'Dialer to 112 was opened and custom emergency SMS coordinates were sent successfully.'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.coordRow}>
            <Ionicons name="location" size={20} color={colors.textTertiary} />
            <View style={styles.coordTexts}>
              <Text style={[styles.coordLabel, { color: colors.textTertiary }]}>DISPATCH GPS COORDINATES</Text>
              <Text style={[styles.coordValue, { color: colors.textPrimary }]}>
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
              { backgroundColor: colors.textPrimary, opacity: pressed ? 0.9 : 1.0 }
            ]}
            onPress={onHome}
            accessibilityRole="button"
            accessibilityLabel="Return to home"
          >
            <Ionicons name="home" size={20} color={colors.bgPrimary} style={{ marginRight: spacing[2] }} />
            <Text style={[styles.homeBtnText, { color: colors.bgPrimary }]}>RETURN TO HOME</Text>
          </Pressable>
          <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
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
