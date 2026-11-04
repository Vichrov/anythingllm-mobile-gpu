#!/usr/bin/env bash
set -euo pipefail
: "ANDROID_HOME:?Android SDK required"
: "VULKAN_SDK:?Pinned Vulkan SDK required"
ndk="$ANDROID_HOME/ndk/27.1.12297006"
build_dir="build/vulkan-native"
prebuilt="build/vulkan-prebuilt/librnllama_v8_2_dotprod_i8mm_vulkan.so"
if [[ ! -f "$prebuilt" ]]; then
cmake -S node_modules/llama.rn/android/src/main/rnllama -B "$build_dir" -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE="$ndk/build/cmake/android.toolchain.cmake" \
  -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-28 \
  -DANDROID_STL=c++_shared -DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON \
  -DCMAKE_BUILD_TYPE=Release -DRNLLAMA_VULKAN_ONLY=ON \
  -DVulkan_INCLUDE_DIR="$VULKAN_SDK/include" \
  -DVulkan_LIBRARY="$ndk/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib/aarch64-linux-android/28/libvulkan.so" \
  -DVulkan_GLSLC_EXECUTABLE="$VULKAN_SDK/bin/glslc"
cmake --build "$build_dir" --target rnllama_v8_2_dotprod_i8mm_vulkan --parallel 2
mkdir -p "$(dirname "$prebuilt")"
cp "$build_dir/librnllama_v8_2_dotprod_i8mm_vulkan.so" "$prebuilt"
fi
cp "$prebuilt" node_modules/llama.rn/android/src/main/jniLibs/arm64-v8a/
# Do not let the loader silently choose OpenCL in the Vulkan APK.
rm -f node_modules/llama.rn/android/src/main/jniLibs/arm64-v8a/*hexagon_opencl.so
