import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG, InferenceConfig, normalizeConfig } from './config';
export * from './config';
const KEY = 'gpu_fork_inference_v1';
let config = DEFAULT_CONFIG;
let ready: Promise<InferenceConfig> | undefined;
export const getInferenceConfig = () => ready ?? (ready = AsyncStorage.getItem(KEY).then(raw => {
  try { config = normalizeConfig(raw ? JSON.parse(raw) : DEFAULT_CONFIG); } catch { config = DEFAULT_CONFIG; }
  return config;
}));
export async function saveInferenceConfig(value: InferenceConfig) {
  const next = normalizeConfig(value);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  config = next;
  ready = Promise.resolve(config);
}
export type InferenceReport = {
  model: string; backend: string; devices: string[]; library?: string;
  loadMs: number; contextLength: number; config: InferenceConfig;
  outputTps?: number; promptTps?: number; tokens?: number; timestamp: number;
};
let reports: InferenceReport[] = [];
const listeners = new Set<() => void>();
export function recordInference(report: InferenceReport) {
  reports = [report, ...reports].slice(0, 12);
  listeners.forEach(listener => listener());
}
export const getInferenceReports = () => reports;
export const subscribeInference = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
