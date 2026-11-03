# AnythingLLM GPU fork

The first milestone is a measurable Adreno GPU path. Upstream deliberately forces `n_gpu_layers: 0` and strips the OpenCL libraries; this fork restores the prebuilt OpenCL variant rather than claiming Vulkan support that llama.rn 0.12.9 does not ship.

## Implemented in 0.1.0

CPU/OpenCL selection, explicit OpenCL device binding (no Hexagon), GPU-layer count, native GPU verification, CPU threads, bounded batch/microbatch, single sequence allocation, mmap without mlock, optional Flash Attention and q8_0 K cache. V cache stays f16 for compatibility. Defaults are CPU, four threads, batch 256, mmap enabled, FA disabled. A settings change is applied in the existing native context queue before the next completion; the old context is released before reloading. Generation speed comes from native timings, not streamed text chunks. The settings panel keeps up to 12 measurements in memory and exports JSON including configuration and model identity. The original chat metrics also show tok/s.

The app installs separately from upstream. Telemetry is disabled and the upstream Firebase build plugins are not applied. Vision projectors remain CPU-only. Experimental builds are release-mode JS bundles signed with the repository debug key.

## Compatibility

The packaged OpenCL binary requires dotprod and i8mm. Meizu 21 is the initial target. Snapdragon 855 is supported in CPU mode only in this milestone. Runtime library loading can fall back to CPU, but selecting GPU then produces an explicit error rather than reporting CPU speed as GPU speed. A native driver crash cannot be caught by JavaScript; reopen and select CPU if necessary.

Profiles are unbenchmarked starting points, not automatic hardware tuning. FA and K-cache quantization can fail for particular model architectures/drivers. Keep defaults for the first comparison. Context size remains the existing workspace setting.

## Build

GitHub Actions `Android GPU APK` installs the locked dependencies, applies the llama.rn patch, tests configuration routing, type-checks, builds ARM64, verifies both OpenCL shared objects and the bundled JS are in the APK, then uploads an artifact and a prerelease with SHA-256. The workflow is triggered by pushes to main or manually. Build success does not establish runtime compatibility or speed.

## Benchmark on Meizu 21

1. Install the separate GPU app and download/import one GGUF model.
2. Set the same context length for all runs; use fresh chats and a fixed prompt. Disable optional tools/RAG for a simple comparison.
3. CPU: apply the CPU profile, send the prompt, record the result; repeat warm runs.
4. GPU: apply Meizu 21 profile, verify OpenCL GPU in diagnostics and repeat. The first load includes driver kernel compilation. Try 16/32/99 layers if memory is tight.
5. Let the device cool between runs. Compare output tok/s separately from prompt tok/s and load time. Share the JSON measurements.

## Next milestone

Restore Vulkan at the native source/build level, add an armv8.2+dotprod GPU build for pre-i8mm devices, validate Qwen/Gemma model compatibility, measure context/batch/FA/cache combinations on real Adreno devices, and choose profiles from evidence. Do not label these future tasks complete on the basis of an APK build.
