import { createSignal, onMount, onCleanup } from 'solid-js';

// Battery Status API types
interface BatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  readonly effectiveType: string;
  readonly downlink: number;
  readonly rtt: number;
  onchange: ((this: NetworkInformation, ev: Event) => any) | null;
}

interface NavigatorExtended extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
  connection?: NetworkInformation;
}

export interface BatteryStatus {
  level: number; // 0-1
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  isSupported: boolean;
}

export interface NetworkStatus {
  effectiveType: string; // 'slow-2g', '2g', '3g', '4g'
  downlink: number; // Mbps
  rtt: number; // ms
  isSupported: boolean;
}

export interface SystemData {
  battery: BatteryStatus;
  network: NetworkStatus;
}

/**
 * Hook for accessing system-level data like battery status and network information
 * Uses web APIs where available, with fallbacks for unsupported browsers
 */
export function useSystemData() {
  const [battery, setBattery] = createSignal<BatteryStatus>({
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    isSupported: false
  });

  const [network, setNetwork] = createSignal<NetworkStatus>({
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    isSupported: false
  });

  onMount(() => {
    const nav = navigator as NavigatorExtended;

    // Battery Status API
    if (nav.getBattery) {
      nav.getBattery().then((batteryManager: BatteryManager) => {
        const updateBattery = () => {
          setBattery({
            level: batteryManager.level,
            charging: batteryManager.charging,
            chargingTime: batteryManager.chargingTime,
            dischargingTime: batteryManager.dischargingTime,
            isSupported: true
          });
        };

        // Initial update
        updateBattery();

        // Listen for changes
        batteryManager.addEventListener('levelchange', updateBattery);
        batteryManager.addEventListener('chargingchange', updateBattery);
        batteryManager.addEventListener('chargingtimechange', updateBattery);
        batteryManager.addEventListener('dischargingtimechange', updateBattery);

        onCleanup(() => {
          batteryManager.removeEventListener('levelchange', updateBattery);
          batteryManager.removeEventListener('chargingchange', updateBattery);
          batteryManager.removeEventListener('chargingtimechange', updateBattery);
          batteryManager.removeEventListener('dischargingtimechange', updateBattery);
        });
      }).catch((error: unknown) => {
        console.warn('Battery Status API not available:', error);
      });
    }

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const updateNetwork = () => {
          setNetwork({
            effectiveType: connection.effectiveType || '4g',
            downlink: connection.downlink || 10,
            rtt: connection.rtt || 50,
            isSupported: true
          });
        };

        // Initial update
        updateNetwork();

        // Listen for changes
        connection.addEventListener('change', updateNetwork);

        onCleanup(() => {
          connection.removeEventListener('change', updateNetwork);
        });
      }
    }
  });

  return {
    battery,
    network,
    // Computed values for convenience
    batteryPercentage: () => Math.round(battery().level * 100),
    isBatteryLow: () => battery().level < 0.2 && !battery().charging,
    isOnline: () => navigator.onLine,
    isWifiLikely: () => network().effectiveType === '4g' && network().downlink > 5
  };
}