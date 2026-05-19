/**
 * Mock Data — RideSafe
 *
 * All static mock data used across screens during development.
 * Replace data source integrations as feature branches are completed:
 *   mockContacts     → AsyncStorage via StorageService  (feature/emergency-contacts)
 *   mockHospitals    → HospitalService + Google Places  (feature/hospital-screen)
 *   mockRideHistory  → AsyncStorage via StorageService  (feature/local-storage)
 *   mockAlertQueue   → QueueService                     (feature/offline-mode)
 */

import type { RideSession, EmergencyContact, Hospital, QueuedAlert } from '../types';

// ─── Ride History ─────────────────────────────────────────────────────────────

export const mockRideHistory: RideSession[] = [
  {
    id: 'ride-001',
    startTime: Date.now() - 1000 * 60 * 60 * 2,
    endTime:   Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 34,
    status: 'ended',
    crashDetected: false,
    distanceKm: 8.4,
    avgSpeedKmh: 32,
  },
  {
    id: 'ride-002',
    startTime: Date.now() - 1000 * 60 * 60 * 26,
    endTime:   Date.now() - 1000 * 60 * 60 * 26 + 1000 * 60 * 18,
    status: 'ended',
    crashDetected: false,
    distanceKm: 4.1,
    avgSpeedKmh: 28,
  },
  {
    id: 'ride-003',
    startTime: Date.now() - 1000 * 60 * 60 * 50,
    endTime:   Date.now() - 1000 * 60 * 60 * 50 + 1000 * 60 * 52,
    status: 'ended',
    crashDetected: false,
    distanceKm: 19.7,
    avgSpeedKmh: 41,
  },
];

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export const mockContacts: EmergencyContact[] = [
  {
    id: 'contact-001',
    name: 'Priya Sharma',
    phone: '9876543210',
    relationship: 'Wife',
    isPrimary: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'contact-002',
    name: 'Rahul Mehta',
    phone: '9123456789',
    relationship: 'Brother',
    isPrimary: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
];

// ─── Hospitals ────────────────────────────────────────────────────────────────

export const mockHospitals: Hospital[] = [
  {
    id: 'hosp-001',
    name: 'Apollo Hospital',
    address: 'Bhat, Gandhinagar, Gujarat',
    phone: '07926300400',
    distanceKm: 2.3,
    etaMinutes: 7,
    isEmergencyCenter: true,
    specialties: ['Emergency', 'Trauma', 'ICU'],
  },
  {
    id: 'hosp-002',
    name: 'Sterling Hospital',
    address: 'Memnagar, Ahmedabad',
    phone: '07940010000',
    distanceKm: 4.1,
    etaMinutes: 12,
    isEmergencyCenter: true,
    specialties: ['Emergency', 'Orthopaedics'],
  },
  {
    id: 'hosp-003',
    name: 'SAL Hospital',
    address: 'Drive-in Road, Ahmedabad',
    phone: '07940005000',
    distanceKm: 6.8,
    etaMinutes: 19,
    isEmergencyCenter: false,
    specialties: ['General', 'Surgery'],
  },
];

// ─── Offline Alert Queue ──────────────────────────────────────────────────────

export const mockAlertQueue: QueuedAlert[] = [
  {
    id: 'alert-001',
    type: 'ride_start',
    payload: { rideId: 'ride-001', startTime: Date.now() - 5000 },
    status: 'pending',
    createdAt: Date.now() - 5000,
    retryCount: 0,
  },
  {
    id: 'alert-002',
    type: 'sos',
    payload: { contactIds: ['contact-001'], location: null },
    status: 'failed',
    createdAt: Date.now() - 120000,
    retryCount: 2,
  },
];
