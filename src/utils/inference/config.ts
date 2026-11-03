export type InferenceConfig = {
  backend: 'cpu' | 'opencl';
  gpuLayers: number;
  threads: number;
  batch: number;
  flashAttention: boolean;
  cacheK: 'f16' | 'q8_0';
  mmap: boolean;
};
export const DEFAULT_CONFIG: InferenceConfig = {
  backend: 'cpu', gpuLayers: 32, threads: 4, batch: 256,
  flashAttention: false, cacheK: 'f16', mmap: true,
};
export const PROFILES: Record<string, InferenceConfig> = {
  'CPU / Snapdragon 855+': { ...DEFAULT_CONFIG, batch: 128 },
  'Adreno / Meizu 21': { ...DEFAULT_CONFIG, backend: 'opencl', gpuLayers: 99 },
  'Adreno / low memory': { ...DEFAULT_CONFIG, backend: 'opencl', gpuLayers: 16, batch: 128 },
};
export function normalizeConfig(value: Partial<InferenceConfig> = {}): InferenceConfig {
  const integer = (v: unknown, fallback: number, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : fallback;
  return {
    backend: value.backend === 'opencl' ? 'opencl' : 'cpu',
    gpuLayers: integer(value.gpuLayers, 32, 1, 999),
    threads: integer(value.threads, 4, 1, 16),
    batch: integer(value.batch, 256, 32, 512),
    flashAttention: value.flashAttention === true,
    cacheK: value.cacheK === 'q8_0' ? 'q8_0' : 'f16',
    mmap: value.mmap !== false,
  };
}
export function selectOpenCLDevice(devices: { backend: string; type: string; deviceName: string }[]): string {
  const device = devices.find(d => /opencl/i.test(d.backend) && /gpu/i.test(d.type));
  if (!device) throw new Error('Adreno OpenCL GPU недоступен. Выберите CPU. Драйвер или нативная библиотека не предоставили OpenCL GPU.');
  return device.deviceName;
}
export function contextOptions(config: InferenceConfig, nCtx: number, device?: string) {
  if (config.backend === 'opencl' && !device) throw new Error('OpenCL device must be selected explicitly');
  return {
    n_gpu_layers: config.backend === 'opencl' ? config.gpuLayers : 0,
    devices: config.backend === 'opencl' ? [device!] : ['CPU'],
    n_threads: config.threads,
    n_batch: Math.min(config.batch, nCtx),
    n_ubatch: Math.min(config.batch, nCtx),
    n_parallel: 1,
    use_mmap: config.mmap,
    use_mlock: false,
    flash_attn_type: config.flashAttention ? 'on' as const : 'off' as const,
    cache_type_k: config.cacheK,
    cache_type_v: 'f16' as const,
  };
}
