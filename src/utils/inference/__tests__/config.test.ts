import { contextOptions, DEFAULT_CONFIG, normalizeConfig, selectGPUDevice } from '../config';
describe('GPU inference configuration', () => {
  it('never auto-selects GPU or DSP in CPU mode', () => {
    expect(contextOptions(DEFAULT_CONFIG, 1024)).toMatchObject({ n_gpu_layers: 0, devices: ['CPU'], use_mlock: false, n_parallel: 1 });
  });
  it('selects OpenCL GPU explicitly and excludes Hexagon', () => {
    const device = selectGPUDevice([
      { backend: 'Hexagon', type: 'accel', deviceName: 'HTP0' },
      { backend: 'OpenCL', type: 'gpu', deviceName: 'GPUOpenCL' },
    ], 'opencl');
    expect(contextOptions({ ...DEFAULT_CONFIG, backend: 'opencl', gpuLayers: 24 }, 128, device))
      .toMatchObject({ devices: ['GPUOpenCL'], n_gpu_layers: 24, n_batch: 128, n_ubatch: 128 });
  });
  it('refuses silent CPU fallback', () => {
    expect(() => selectGPUDevice([{ backend: 'CPU', type: 'cpu', deviceName: 'CPU' }], 'opencl')).toThrow();
    expect(() => contextOptions({ ...DEFAULT_CONFIG, backend: 'opencl' }, 1024)).toThrow();
  });
  it('bounds settings loaded from storage', () => {
    expect(normalizeConfig({ threads: 100, gpuLayers: -1, batch: NaN })).toMatchObject({ threads: 16, gpuLayers: 1, batch: 256 });
  });
});

it('selects Vulkan explicitly, never OpenCL or DSP as a substitute', () => {
  const devices = [
    { backend: 'OpenCL', type: 'gpu', deviceName: 'GPUOpenCL' },
    { backend: 'Vulkan', type: 'igpu', deviceName: 'Vulkan0' },
  ];
  expect(selectGPUDevice(devices, 'vulkan')).toBe('Vulkan0');
  expect(() => selectGPUDevice(devices.slice(0, 1), 'vulkan')).toThrow();
  expect(contextOptions({ ...DEFAULT_CONFIG, backend: 'vulkan', gpuLayers: 99 }, 4096, 'Vulkan0'))
    .toMatchObject({ n_gpu_layers: 99, devices: ['Vulkan0'], cache_type_k: 'f16', cache_type_v: 'f16', flash_attn_type: 'off' });
});
