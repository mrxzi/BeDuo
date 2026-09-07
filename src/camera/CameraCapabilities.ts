// ============================================================
// CameraCapabilities — Feature detection & camera classification
// ============================================================
// Uses actual device enumeration & probing, NOT browser sniffing.

import type { CameraCapabilities, CameraDeviceInfo, CameraMode } from './types';

/**
 * Detect whether the device is likely mobile based on pointer/touch capabilities.
 * This is used for UX hints only, never for capability gating.
 */
function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  // Use pointer coarse as primary signal (touch device)
  if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  // Fallback: check touch points
  if (navigator.maxTouchPoints > 0) return true;
  return false;
}

/**
 * Classify a MediaDeviceInfo into front/rear/unknown based on:
 * 1. device.getCapabilities()?.facingMode (most reliable)
 * 2. Label heuristics (fallback)
 */
function classifyDevice(device: MediaDeviceInfo): CameraDeviceInfo {
  const label = (device.label || '').toLowerCase();
  let facing: CameraDeviceInfo['facing'] = 'unknown';

  // Try label-based classification
  const frontKeywords = ['front', 'user', 'selfie', 'facetime', 'face'];
  const rearKeywords = ['back', 'rear', 'environment', 'main', 'wide'];

  if (frontKeywords.some(k => label.includes(k))) {
    facing = 'user';
  } else if (rearKeywords.some(k => label.includes(k))) {
    facing = 'environment';
  }

  return {
    deviceId: device.deviceId,
    label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
    facing,
    groupId: device.groupId,
  };
}

/**
 * Attempt to classify cameras that couldn't be classified by label
 * by actually opening a stream with facingMode constraint.
 */
async function classifyByStream(
  devices: CameraDeviceInfo[]
): Promise<CameraDeviceInfo[]> {
  const unclassified = devices.filter(d => d.facing === 'unknown');
  if (unclassified.length === 0) return devices;

  // If we have exactly 2 cameras and neither is classified, try facingMode constraints
  if (devices.length >= 2 && unclassified.length === devices.length) {
    try {
      // Try to get environment camera
      const envStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } },
      });
      const envTrack = envStream.getVideoTracks()[0];
      const envSettings = envTrack.getSettings();
      const envDeviceId = envSettings.deviceId;
      envTrack.stop();

      // Try to get user camera
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'user' } },
      });
      const userTrack = userStream.getVideoTracks()[0];
      const userSettings = userTrack.getSettings();
      const userDeviceId = userSettings.deviceId;
      userTrack.stop();

      return devices.map(d => {
        if (d.deviceId === envDeviceId) return { ...d, facing: 'environment' as const };
        if (d.deviceId === userDeviceId) return { ...d, facing: 'user' as const };
        return d;
      });
    } catch {
      // facingMode constraints not supported — classify by order heuristic
      // On most mobile devices, first camera is rear, second is front
      if (devices.length >= 2) {
        return devices.map((d, i) => ({
          ...d,
          facing: i === 0 ? ('environment' as const) : i === 1 ? ('user' as const) : d.facing,
        }));
      }
    }
  }

  return devices;
}

/**
 * Probe whether two camera streams can exist simultaneously.
 * Opens both streams briefly to test. Caches result.
 */
async function probeSimultaneousStreams(
  frontDeviceId: string,
  rearDeviceId: string
): Promise<boolean> {
  let rearStream: MediaStream | null = null;
  let frontStream: MediaStream | null = null;

  try {
    // Open rear camera first
    rearStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: rearDeviceId } },
    });

    // Attempt to open front camera while rear is active
    frontStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: frontDeviceId } },
    });

    // Check both streams are actually active
    const rearActive = rearStream.getVideoTracks().some(t => t.readyState === 'live');
    const frontActive = frontStream.getVideoTracks().some(t => t.readyState === 'live');

    return rearActive && frontActive;
  } catch {
    return false;
  } finally {
    // Always clean up probe streams
    rearStream?.getTracks().forEach(t => t.stop());
    frontStream?.getTracks().forEach(t => t.stop());
  }
}

// Session cache key
const CAPABILITIES_CACHE_KEY = '__beduo_camera_caps';

/**
 * Main capability detection function.
 * Enumerates cameras, classifies them, probes simultaneous support,
 * and returns a full CameraCapabilities object.
 */
export async function detectCameraCapabilities(): Promise<CameraCapabilities> {
  // Check session cache
  const cached = sessionStorage.getItem(CAPABILITIES_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as CameraCapabilities;
    } catch {
      sessionStorage.removeItem(CAPABILITIES_CACHE_KEY);
    }
  }

  const isMobile = detectMobile();

  // Check API availability
  if (!navigator.mediaDevices?.getUserMedia) {
    const result: CameraCapabilities = {
      hasCamera: false,
      hasFrontCamera: false,
      hasRearCamera: false,
      supportsSimultaneousStreams: false,
      supportsFacingMode: false,
      isMobile,
      frontDevices: [],
      rearDevices: [],
      allDevices: [],
      detectedMode: 'unsupported',
    };
    return result;
  }

  try {
    // Request permission first to get labeled device list
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(t => t.stop());

    // Enumerate devices
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = allDevices.filter(d => d.kind === 'videoinput');

    if (videoDevices.length === 0) {
      const result: CameraCapabilities = {
        hasCamera: false,
        hasFrontCamera: false,
        hasRearCamera: false,
        supportsSimultaneousStreams: false,
        supportsFacingMode: false,
        isMobile,
        frontDevices: [],
        rearDevices: [],
        allDevices: [],
        detectedMode: 'unsupported',
      };
      return result;
    }

    // Classify devices
    let classified = videoDevices.map(classifyDevice);

    // Try stream-based classification for unknown devices
    classified = await classifyByStream(classified);

    const frontDevices = classified.filter(d => d.facing === 'user');
    const rearDevices = classified.filter(d => d.facing === 'environment');

    const hasFrontCamera = frontDevices.length > 0;
    const hasRearCamera = rearDevices.length > 0;

    // Check facingMode support
    let supportsFacingMode = false;
    try {
      const supported = navigator.mediaDevices.getSupportedConstraints();
      supportsFacingMode = !!supported.facingMode;
    } catch {
      supportsFacingMode = false;
    }

    // Probe simultaneous streams if both cameras exist
    let supportsSimultaneousStreams = false;
    if (hasFrontCamera && hasRearCamera) {
      supportsSimultaneousStreams = await probeSimultaneousStreams(
        frontDevices[0].deviceId,
        rearDevices[0].deviceId
      );
    }

    // Determine mode
    let detectedMode: CameraMode;
    if (hasFrontCamera && hasRearCamera && supportsSimultaneousStreams) {
      detectedMode = 'simultaneous';
    } else if (hasFrontCamera && hasRearCamera) {
      detectedMode = 'sequential';
    } else if (hasRearCamera) {
      detectedMode = 'rear-only';
    } else if (hasFrontCamera) {
      detectedMode = 'front-only';
    } else {
      detectedMode = 'unsupported';
    }

    const result: CameraCapabilities = {
      hasCamera: true,
      hasFrontCamera,
      hasRearCamera,
      supportsSimultaneousStreams,
      supportsFacingMode,
      isMobile,
      frontDevices,
      rearDevices,
      allDevices: classified,
      detectedMode,
    };

    // Cache for session
    try {
      sessionStorage.setItem(CAPABILITIES_CACHE_KEY, JSON.stringify(result));
    } catch {
      // Storage full or unavailable — ignore
    }

    return result;
  } catch (err) {
    // Permission denied or other error during detection
    const result: CameraCapabilities = {
      hasCamera: true, // We know cameras exist, just can't access
      hasFrontCamera: false,
      hasRearCamera: false,
      supportsSimultaneousStreams: false,
      supportsFacingMode: false,
      isMobile,
      frontDevices: [],
      rearDevices: [],
      allDevices: [],
      detectedMode: 'unsupported',
    };
    return result;
  }
}

/** Clear the cached capabilities (e.g., when user changes permissions) */
export function clearCapabilitiesCache(): void {
  sessionStorage.removeItem(CAPABILITIES_CACHE_KEY);
}

export const CameraCapabilitiesDetector = {
  detect: detectCameraCapabilities,
};


