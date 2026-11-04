# Vulkan / OpenCL comparison build 0.1.1

Two release-mode ARM64 APKs, same application ID and signing key. Install **vulkan** to test Vulkan; install **opencl** to switch back. Both have the same versionCode (10002), so switching between these two 0.1.1 APKs preserves models, chats and settings. Do not uninstall between switches. GPU selection is automatically mapped to the backend of the installed build; CPU mode stays CPU.

Vulkan is compiled from llama.cpp revision `6c8dcaa7ae41fa9f4aa2b3b68ee82cb8b2a03632`, matching llama.rn 0.12.9, with symbol prefixes matching llama.rn. SPIR-V shaders are compiled offline with Vulkan SDK 1.4.363.1 and embedded in the native library. The Vulkan APK does not contain the OpenCL accelerator, preventing silent backend substitution.

Settings → local model → GPU Lab → Adreno / Meizu 21 → Apply. Baseline: all layers (99), f16 K/V cache, Flash Attention OFF. These choices follow the user's Meizu 21 measurements; profiles are not universal speed guarantees. This native accelerator currently requires dotprod+i8mm (Meizu 21 target).

The existing OpenCL result was 7.99 tok/s vs CPU 4.57 tok/s on Qwen3.5-4B, context 4096, from the user's screenshot. Different response lengths mean this is an initial observation, not a controlled benchmark. No Vulkan device benchmark has been measured yet.

Compare the same GGUF, context, prompt and settings; repeat warm runs on a cooled phone. Native output tok/s excludes loading and prompt processing. The load timer now includes device discovery. Diagnostics show the actual device and library; selecting unavailable GPU raises an explicit error. Native driver failures still require testing on a physical device.

Telemetry remains disabled. Both experimental APKs use the repository debug signing key.

The Vulkan APK requires Android 9 (API 28) or newer for Vulkan 1.1 loader entry points. The OpenCL APK keeps its previous minimum Android version.
