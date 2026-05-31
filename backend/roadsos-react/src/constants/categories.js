import {
  Building2,
  Shield,
  Ambulance,
  Wrench,
  CarFront,
  Car,
} from 'lucide-react'

/**
 * All service categories matching the Flutter app.
 * Each category has an icon, label, color, Overpass queries,
 * and a national emergency fallback number.
 */
const CATEGORIES = {
  trauma: {
    icon: Building2,
    label: 'Trauma Centres',
    color: '#EF4444',
    queries: [{ key: 'amenity', value: 'hospital' }],
    emergencyNum: '108',
    isHospital: true,
  },
  police: {
    icon: Shield,
    label: 'Police Stations',
    color: '#3B82F6',
    queries: [{ key: 'amenity', value: 'police' }],
    emergencyNum: '100',
  },
  ambulance: {
    icon: Ambulance,
    label: 'Ambulance',
    color: '#F59E0B',
    queries: [
      { key: 'emergency', value: 'ambulance_station' },
      { key: 'amenity', value: 'ambulance_station' },
      { key: 'healthcare', value: 'emergency' },
    ],
    emergencyNum: '108',
  },
  puncture: {
    icon: Wrench,
    label: 'Puncture / Garage',
    color: '#8B5CF6',
    queries: [
      { key: 'shop', value: 'tyres' },
      { key: 'shop', value: 'car_repair' },
      { key: 'shop', value: 'motorcycle_repair' },
    ],
    emergencyNum: '1800-180-1522',
  },
  towing: {
    icon: CarFront,
    label: 'Towing / Rescue',
    color: '#10B981',
    queries: [
      { key: 'amenity', value: 'vehicle_rescue' },
      { key: 'emergency', value: 'roadside_rescue' },
      { key: 'shop', value: 'car_repair' },
    ],
    emergencyNum: '1800-180-1522',
  },
  showroom: {
    icon: Car,
    label: 'Car Showrooms',
    color: '#EC4899',
    queries: [
      { key: 'shop', value: 'car' },
      { key: 'shop', value: 'motorcycle' },
      { key: 'shop', value: 'vehicle' },
    ],
    emergencyNum: '112',
  },
}

export default CATEGORIES
