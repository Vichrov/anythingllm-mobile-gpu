Experimental ARM64 Android build, separate application ID: com.vichrov.anythingllm.gpu.

- Adreno GPU inference through llama.rn 0.12.9 **OpenCL**, not Vulkan.
- Settings → model/provider → on-device → GPU Lab: CPU/GPU, layer count, CPU threads, batch, mmap, Flash Attention and K-cache controls.
- GPU selection fails explicitly when the GPU is unavailable; no silent CPU fallback.
- Actual native device/library, load time and generation tok/s; shareable measurements.
- Profiles are starting points, not measured performance claims.
- The bundled GPU library requires ARM dotprod + i8mm (Meizu 21 / Snapdragon 8 Gen 3 target). Snapdragon 855 uses CPU in this build. Vulkan and broader GPU support remain follow-up work.
- Flash Attention and Q8 K cache are experimental and off by default; V cache remains f16.
- Telemetry is disabled. Vision projector stays on CPU.
- Uses the repository's public debug signing key for this experimental release, not a private production key.

No physical-device speed measurements yet. Start with CPU, send a fixed prompt in a fresh chat, then select the Meizu 21 profile and repeat in a fresh chat with the same model/context. If full offload fails, try 16 layers and batch 128. First GPU load may compile kernels and take longer.
