/**
 * MapViewCompat — Universal Premium Tactical Map Compatibility Shim
 *
 * Designed to replace blank react-native-maps screens in Expo Go.
 * Provides a 100% interactive, cyber-security emergency HUD.
 * Supports Panning, Multi-Level Zooming, dynamic polyline routing,
 * search radius circles, custom markers, and selection callouts.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  PanResponder,
  TouchableOpacity,
  Animated,
  Easing,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Force the high-fidelity interactive fallback to bypass native Google Map blank screen limits in Expo Go
const isAvailable = false;

// ─── Fallback Map Implementation ──────────────────────────────────────────────

interface FallbackMapProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  [key: string]: any;
}

// Helper to flatten react children for parsing markers, polylines, circles
const flattenChildren = (children: React.ReactNode): any[] => {
  const result: any[] = [];
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child));
    } else if (React.isValidElement(child)) {
      result.push(child);
    }
  });
  return result;
};

// ─── Minimalist Map Vector Features ──────────────────────────────────────────
const BASE_FEATURES = {
  parks: [
    { latitude: 0.008, longitude: 0.008, size: 0.006 },
    { latitude: -0.012, longitude: 0.005, size: 0.008 },
    { latitude: -0.003, longitude: -0.012, size: 0.005 },
    { latitude: 0.015, longitude: -0.01, size: 0.007 },
  ],
  lakes: [
    { latitude: 0.004, longitude: -0.006, sizeX: 0.007, sizeY: 0.005 },
    { latitude: -0.008, longitude: -0.008, sizeX: 0.005, sizeY: 0.005 },
    { latitude: -0.015, longitude: 0.012, sizeX: 0.006, sizeY: 0.004 },
  ],
  roads: [
    // Main highways (thick diagonal streets)
    { from: { lat: -0.03, lng: -0.03 }, to: { lat: 0.03, lng: 0.03 }, width: 14 },
    { from: { lat: 0.015, lng: -0.03 }, to: { lat: -0.015, lng: 0.03 }, width: 10 },
    // Horizontal streets
    { from: { lat: 0.01, lng: -0.03 }, to: { lat: 0.01, lng: 0.03 }, width: 6 },
    { from: { lat: -0.01, lng: -0.03 }, to: { lat: -0.01, lng: 0.03 }, width: 6 },
    { from: { lat: 0.0, lng: -0.03 }, to: { lat: 0.0, lng: 0.03 }, width: 6 },
    { from: { lat: 0.02, lng: -0.03 }, to: { lat: 0.02, lng: 0.03 }, width: 6 },
    { from: { lat: -0.02, lng: -0.03 }, to: { lat: -0.02, lng: 0.03 }, width: 6 },
    // Vertical streets
    { from: { lat: -0.03, lng: 0.01 }, to: { lat: 0.03, lng: 0.01 }, width: 6 },
    { from: { lat: -0.03, lng: -0.01 }, to: { lat: 0.03, lng: -0.01 }, width: 6 },
    { from: { lat: -0.03, lng: 0.0 }, to: { lat: 0.03, lng: 0.0 }, width: 6 },
    { from: { lat: -0.03, lng: 0.02 }, to: { lat: 0.03, lng: 0.02 }, width: 6 },
    { from: { lat: -0.03, lng: -0.02 }, to: { lat: 0.03, lng: -0.02 }, width: 6 },
  ],
};

function FallbackMap({
  style,
  children,
  initialRegion,
  region,
  showsUserLocation = true,
}: FallbackMapProps): React.JSX.Element {
  const childElements = flattenChildren(children);

  // Extract map features from children properties to maintain full component modularity
  const markers = childElements.filter((c) => c.props && c.props.coordinate);
  const polylines = childElements.filter((c) => c.props && c.props.coordinates);
  const circles = childElements.filter((c) => c.props && c.props.center);

  // 1. Establish Map Center (Priority: Live region prop > initialRegion prop > First Marker > Rajkot Center)
  const mapCenterLat = region?.latitude ?? initialRegion?.latitude ?? (markers[0]?.props?.coordinate?.latitude) ?? 23.0225;
  const mapCenterLng = region?.longitude ?? initialRegion?.longitude ?? (markers[0]?.props?.coordinate?.longitude) ?? 72.5714;

  const mapLatDelta = region?.latitudeDelta ?? initialRegion?.latitudeDelta ?? 0.03;
  const mapLngDelta = region?.longitudeDelta ?? initialRegion?.longitudeDelta ?? 0.03;

  // 2. Interactive Map States
  const [centerOffset, setCenterOffset] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(1.1);
  const [dimensions, setDimensions] = useState({ width: 360, height: 360 });
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  // Live Deltas and Center based on zoom scale & user drag offsets
  const currentLatDelta = mapLatDelta / zoom;
  const currentLngDelta = mapLngDelta / zoom;

  const activeCenterLat = mapCenterLat + centerOffset.lat;
  const activeCenterLng = mapCenterLng + centerOffset.lng;

  // Radar pulse animation for user location
  const radarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, [radarAnim]);

  const pulseScale = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 2.5],
  });

  const pulseOpacity = radarAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 0.35, 0],
  });

  // Radar sweep animation
  const sweepAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [sweepAnim]);

  const sweepRotation = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Reset offset if region prop updates to sync with dynamic routing simulators
  const prevRegionRef = useRef<any>(null);
  useEffect(() => {
    if (region && (region.latitude !== prevRegionRef.current?.latitude || region.longitude !== prevRegionRef.current?.longitude)) {
      setCenterOffset({ lat: 0, lng: 0 });
      prevRegionRef.current = region;
    }
  }, [region]);

  // 3. PanResponder Configuration (Drag/Translate gestures)
  const startOffset = useRef({ lat: 0, lng: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startOffset.current = { ...centerOffset };
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Drag calculations: Up is positive gesture dy, maps to decrease in center latitude (moves map down)
        const dragLat = (gestureState.dy / dimensions.height) * currentLatDelta;
        const dragLng = -(gestureState.dx / dimensions.width) * currentLngDelta;

        setCenterOffset({
          lat: startOffset.current.lat + dragLat,
          lng: startOffset.current.lng + dragLng,
        });
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // 4. Coordinates to Pixel Projection Utility
  const mapCoordsToScreen = (lat: number, lng: number) => {
    const pctX = 50 + ((lng - activeCenterLng) / currentLngDelta) * 50;
    const pctY = 50 - ((lat - activeCenterLat) / currentLatDelta) * 50;

    const x = (pctX / 100) * dimensions.width;
    const y = (pctY / 100) * dimensions.height;

    return { x, y, pctX, pctY };
  };

  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  };

  // 5. Visual Renderers
  const renderBackgroundFeatures = () => {
    const renderedFeatures: React.JSX.Element[] = [];

    // Render Parks
    BASE_FEATURES.parks.forEach((park, idx) => {
      const lat = mapCenterLat + park.latitude;
      const lng = mapCenterLng + park.longitude;
      const pt = mapCoordsToScreen(lat, lng);
      
      const sizeDegrees = park.size;
      const pixelWidth = (sizeDegrees / currentLngDelta) * dimensions.width * 0.5;
      const pixelHeight = (sizeDegrees / currentLatDelta) * dimensions.height * 0.5;

      if (pixelWidth > 2 && pixelHeight > 2) {
        renderedFeatures.push(
          <View
            key={`park-${idx}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: pt.x - pixelWidth / 2,
              top: pt.y - pixelHeight / 2,
              width: pixelWidth,
              height: pixelHeight,
              borderRadius: Math.min(pixelWidth, pixelHeight) * 0.25,
              backgroundColor: '#E2F2E4', // Soft park green
              opacity: 0.85,
            }}
          />
        );
      }
    });

    // Render Lakes
    BASE_FEATURES.lakes.forEach((lake, idx) => {
      const lat = mapCenterLat + lake.latitude;
      const lng = mapCenterLng + lake.longitude;
      const pt = mapCoordsToScreen(lat, lng);
      
      const sizeXDegrees = lake.sizeX;
      const sizeYDegrees = lake.sizeY;
      const pixelWidth = (sizeXDegrees / currentLngDelta) * dimensions.width * 0.5;
      const pixelHeight = (sizeYDegrees / currentLatDelta) * dimensions.height * 0.5;

      if (pixelWidth > 2 && pixelHeight > 2) {
        renderedFeatures.push(
          <View
            key={`lake-${idx}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: pt.x - pixelWidth / 2,
              top: pt.y - pixelHeight / 2,
              width: pixelWidth,
              height: pixelHeight,
              borderRadius: Math.min(pixelWidth, pixelHeight) * 0.5, // Circular/oval
              backgroundColor: '#BAE6FD', // Soft sky blue
              opacity: 0.9,
            }}
          />
        );
      }
    });

    // Render Roads
    BASE_FEATURES.roads.forEach((road, idx) => {
      const fromLat = mapCenterLat + road.from.lat;
      const fromLng = mapCenterLng + road.from.lng;
      const toLat = mapCenterLat + road.to.lat;
      const toLng = mapCenterLng + road.to.lng;

      const pt1 = mapCoordsToScreen(fromLat, fromLng);
      const pt2 = mapCoordsToScreen(toLat, toLng);

      const dx = pt2.x - pt1.x;
      const dy = pt2.y - pt1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 2) return;

      const angle = Math.atan2(dy, dx);
      const angleDeg = (angle * 180) / Math.PI;

      // Road Casing (subtle border)
      renderedFeatures.push(
        <View
          key={`road-casing-${idx}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: pt1.x + dx / 2 - length / 2,
            top: pt1.y + dy / 2 - (road.width + 2) / 2,
            width: length,
            height: road.width + 2,
            transform: [{ rotate: `${angleDeg}deg` }],
            backgroundColor: '#E2E8F0', // Border casing
            borderRadius: (road.width + 2) / 2,
          }}
        />
      );

      // Road Core (white road)
      renderedFeatures.push(
        <View
          key={`road-core-${idx}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: pt1.x + dx / 2 - length / 2,
            top: pt1.y + dy / 2 - road.width / 2,
            width: length,
            height: road.width,
            transform: [{ rotate: `${angleDeg}deg` }],
            backgroundColor: '#FFFFFF', // Clean white road
            borderRadius: road.width / 2,
          }}
        />
      );
    });

    return renderedFeatures;
  };

  // Polylines rendered using high-performance calculated absolute View segments (WAV & SVG independent!)
  const renderPolylineSegments = (polyline: any, idx: number) => {
    const coords = polyline.props.coordinates || [];
    if (coords.length < 2) return null;

    const strokeColor = polyline.props.strokeColor || '#3182CE';
    const strokeWidth = polyline.props.strokeWidth || 4.5;
    const segments: React.JSX.Element[] = [];

    for (let i = 0; i < coords.length - 1; i++) {
      const pt1 = mapCoordsToScreen(coords[i].latitude, coords[i].longitude);
      const pt2 = mapCoordsToScreen(coords[i + 1].latitude, coords[i + 1].longitude);

      // Simple clipping to prevent screen overflows
      const pad = 150;
      if (
        (pt1.x < -pad && pt2.x < -pad) ||
        (pt1.x > dimensions.width + pad && pt2.x > dimensions.width + pad) ||
        (pt1.y < -pad && pt2.y < -pad) ||
        (pt1.y > dimensions.height + pad && pt2.y > dimensions.height + pad)
      ) {
        continue;
      }

      const dx = pt2.x - pt1.x;
      const dy = pt2.y - pt1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 0.8) continue;

      const angle = Math.atan2(dy, dx);
      const angleDeg = (angle * 180) / Math.PI;

      segments.push(
        <View
          key={`polyline-${idx}-seg-${i}`}
          style={{
            position: 'absolute',
            left: pt1.x + dx / 2 - length / 2,
            top: pt1.y + dy / 2 - strokeWidth / 2,
            width: length,
            height: strokeWidth,
            transform: [{ rotate: `${angleDeg}deg` }],
            backgroundColor: strokeColor,
            borderRadius: strokeWidth / 2,
            opacity: 0.9,
          }}
        />
      );
    }

    return segments;
  };

  // Circles (search boundary anchors)
  const renderCircle = (circle: any, idx: number) => {
    const center = circle.props.center;
    if (!center) return null;

    const radiusM = circle.props.radius || 1000;
    const fillColor = circle.props.fillColor || 'rgba(0,191,255,0.06)';
    const strokeColor = circle.props.strokeColor || '#00BFFF';
    const strokeWidth = circle.props.strokeWidth || 1.5;

    const radiusDegrees = radiusM / 111320; // 1 degree lat is approx 111.3km
    const pixelRadius = (radiusDegrees / currentLatDelta) * dimensions.height * 0.5;

    const pt = mapCoordsToScreen(center.latitude, center.longitude);

    return (
      <View
        key={`circle-${idx}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: pt.x - pixelRadius,
          top: pt.y - pixelRadius,
          width: pixelRadius * 2,
          height: pixelRadius * 2,
          borderRadius: pixelRadius,
          backgroundColor: fillColor,
          borderColor: strokeColor,
          borderWidth: strokeWidth,
        }}
      />
    );
  };

  // Redesigned Google Maps style clean red drop-pins
  const renderMarker = (marker: any, idx: number) => {
    const coord = marker.props.coordinate;
    if (!coord) return null;

    const pt = mapCoordsToScreen(coord.latitude, coord.longitude);
    const customContent = marker.props.children;
    const title = marker.props.title || 'Incident Marker';
    const description = marker.props.description || '';

    const markerId = `m-${idx}`;
    const isSelected = selectedMarker && selectedMarker.id === markerId;

    return (
      <View
        key={`marker-${idx}`}
        style={{
          position: 'absolute',
          left: pt.x - 20,
          top: pt.y - 32, // Offset top so the pin tip anchors exactly to coordinates
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: isSelected ? 999 : 100 + idx,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setSelectedMarker({
              id: markerId,
              title,
              description,
              coordinate: coord,
              onCalloutPress: marker.props.onCalloutPress,
            });
          }}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: isSelected ? 1.25 : 1.0 }],
          }}
        >
          {customContent ? (
            <View style={styles.customContentContainer}>
              {customContent}
            </View>
          ) : (
            // Clean Google Maps red drop-pin
            <View style={styles.googlePinContainer}>
              {/* Teardrop drop shadow circle */}
              <View style={styles.pinShadow} />
              <View style={styles.pinWrapper}>
                <Ionicons name="location" size={32} color="#EF4444" />
                {/* White inner center dot in pin head */}
                <View style={styles.pinInnerDot} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      {/* ─── BACKGROUND VECTOR MAP LAYERS ─────────────────────────────── */}
      {renderBackgroundFeatures()}

      {/* Dynamic query range boundary circles (hospital search radius) */}
      {circles.map((c, idx) => renderCircle(c, idx))}

      {/* Route Navigation Polylines */}
      {polylines.map((p, idx) => renderPolylineSegments(p, idx))}

      {/* Pulsing GPS user location dot */}
      {showsUserLocation && !region && (
        <View
          style={[
            styles.userLocationAnchor,
            {
              left: mapCoordsToScreen(mapCenterLat, mapCenterLng).x - 40,
              top: mapCoordsToScreen(mapCenterLat, mapCenterLng).y - 40,
            },
          ]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          <View style={styles.userPulseDot} />
        </View>
      )}

      {/* Google Maps style incident pins */}
      {markers.map((m, idx) => renderMarker(m, idx))}

      {/* ─── FLOATING GOOGLE MAPS STYLE SEARCH COORDINATES CHIP ─────────── */}
      <View style={styles.minimalSearchChip} pointerEvents="none">
        <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
        <Text style={styles.minimalSearchText}>
          {activeCenterLat.toFixed(4)}°N, {activeCenterLng.toFixed(4)}°E · {(zoom * 100).toFixed(0)}%
        </Text>
        <View style={styles.activeSignalDot} />
      </View>

      {/* ─── BOTTOM RIGHT ZOOM / ACTION FLOAT CONTROLS ───────────────────── */}
      <View style={styles.controlsContainer}>
        {/* Reset View Center */}
        <TouchableOpacity
          onPress={() => {
            setCenterOffset({ lat: 0, lng: 0 });
            setZoom(1.1);
            setSelectedMarker(null);
          }}
          style={styles.controlBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={18} color="#3B82F6" />
        </TouchableOpacity>

        {/* Zoom In */}
        <TouchableOpacity
          onPress={() => setZoom((z) => Math.min(z + 0.35, 6.0))}
          style={styles.controlBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#475569" />
        </TouchableOpacity>

        {/* Zoom Out */}
        <TouchableOpacity
          onPress={() => setZoom((z) => Math.max(z - 0.35, 0.45))}
          style={styles.controlBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* ─── FLOATING WHITE MATERIAL MARKER CALLOUT OVERLAY ───────────── */}
      {selectedMarker && (
        <View style={styles.calloutCard}>
          <View style={styles.calloutHeader}>
            <View style={styles.calloutIconCircle}>
              <Ionicons
                name={selectedMarker.title.toLowerCase().includes('hospital') ? 'medical' : 'location'}
                size={18}
                color="#3B82F6"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.calloutTitle} numberOfLines={1}>
                {selectedMarker.title}
              </Text>
              {selectedMarker.description ? (
                <Text style={styles.calloutDesc} numberOfLines={2}>
                  {selectedMarker.description}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setSelectedMarker(null)}
              style={styles.calloutClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {selectedMarker.onCalloutPress ? (
            <TouchableOpacity
              style={styles.calloutBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (selectedMarker.onCalloutPress) {
                  selectedMarker.onCalloutPress();
                }
                setSelectedMarker(null);
              }}
            >
              <Text style={styles.calloutBtnText}>Open Medical Details & Route</Text>
              <Ionicons name="arrow-forward-outline" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── Fallback no-op sub-components ───────────────────────────────────────────

function FallbackMarker(_props: any): null {
  return null;
}
function FallbackPolyline(_props: any): null {
  return null;
}
function FallbackCircle(_props: any): null {
  return null;
}

// ─── Exports — Drop-in replacements ──────────────────────────────────────────

export const MapView: any = isAvailable ? null : FallbackMap;
export const Marker: any = isAvailable ? null : FallbackMarker;
export const Polyline: any = isAvailable ? null : FallbackPolyline;
export const Circle: any = isAvailable ? null : FallbackCircle;
export const PROVIDER_DEFAULT: any = null;
export default MapView;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC', // Sleek clean light-slate canvas
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  googlePinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    position: 'absolute',
    bottom: -1,
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInnerDot: {
    position: 'absolute',
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  userLocationAnchor: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.28)',
  },
  userPulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6', // Google blue position dot
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  minimalSearchChip: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  minimalSearchText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  activeSignalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Clean signal green dot
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 14,
    gap: 10,
    zIndex: 1000,
  },
  controlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  calloutCard: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 70, // Leaves side padding for floating buttons
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    zIndex: 2000,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  calloutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF', // Soft medical blue backdrop
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  calloutDesc: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  calloutClose: {
    padding: 4,
  },
  calloutBtn: {
    backgroundColor: '#3B82F6', // Google blue theme
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 6,
  },
  calloutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  customContentContainer: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
