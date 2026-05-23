/**
 * Services barrel — feature/placeholder-services ✅
 *
 * All services are integration-ready placeholders.
 * Each file contains detailed TODO comments showing exactly
 * how to connect the real implementation.
 *
 * Usage:
 *   import { CrashDetectionService } from '@services/crashDetection.service';
 *   import { EmergencyService }      from '@services/emergency.service';
 *   import { SyncService }           from '@services/sync.service';
 *   import { HospitalService }       from '@services/hospital.service';
 *   import { NotificationService }   from '@services/notification.service';
 */

export { CrashDetectionService } from './crashDetection.service';
export type { CrashEvent, CrashSeverity } from './crashDetection.service';

export { EmergencyService } from './emergency.service';
export type { SOSPayload, SOSResult } from './emergency.service';

export { SyncService } from './sync.service';
export type { SyncResult, SyncEntity } from './sync.service';

export { HospitalService } from './hospital.service';
export type { UserLocation, HospitalSearchOptions } from './hospital.service';

export { NotificationService } from './notification.service';
export type { NotificationType, NotificationPayload } from './notification.service';

export { NavigationService } from './navigation.service';
export type { RouteStep, RouteDetails } from './navigation.service';

export { AlertController } from './alertController';
export { SosService } from './sosService';
export type { SosSendResult } from './sosService';

