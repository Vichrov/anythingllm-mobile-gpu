#!/usr/bin/env python3
"""Restore the Vulkan backend from llama.rn's exact pinned llama.cpp revision."""
import argparse
import pathlib
import shutil
import subprocess

REVISION = '6c8dcaa7ae41fa9f4aa2b3b68ee82cb8b2a03632'
parser = argparse.ArgumentParser()
parser.add_argument('upstream', type=pathlib.Path)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[2]
package = root / 'node_modules/llama.rn'
upstream = args.upstream.resolve()
actual = subprocess.check_output(['git', '-C', str(upstream), 'rev-parse', 'HEAD'], text=True).strip()
if actual != REVISION:
    raise SystemExit(f'Expected llama.cpp {REVISION}, got {actual}')
import json
if json.loads((package / 'package.json').read_text())['version'] != '0.12.9':
    raise SystemExit('Vulkan restoration requires llama.rn 0.12.9')
cpp = package / 'cpp'
shutil.copytree(upstream / 'ggml/src/ggml-vulkan', cpp / 'ggml-vulkan', dirs_exist_ok=True)
shutil.copy2(upstream / 'ggml/include/ggml-vulkan.h', cpp / 'ggml-vulkan.h')
# Match llama.rn bootstrap's symbol isolation, including generated shader symbols.
for p in [cpp / 'ggml-vulkan.h', *list((cpp / 'ggml-vulkan').rglob('*'))]:
    if p.is_file():
        s = p.read_text()
        for old, new in [('GGML_', 'LM_GGML_'), ('ggml_', 'lm_ggml_'), ('GGUF_', 'LM_GGUF_'), ('gguf_', 'lm_gguf_')]:
            s = s.replace(old, new)
        p.write_text(s)
cmake = cpp / 'ggml-vulkan/CMakeLists.txt'
s = cmake.read_text().replace('../../include/ggml-vulkan.h', '../ggml-vulkan.h')
# Headers come from the pinned SDK include directory, never host system libc headers.
s = s.replace('find_package(SPIRV-Headers CONFIG REQUIRED)', '')
shim = '''
# Link Vulkan objects into the same rnllama DSO as the CPU/core, preserving one registry.
function(lm_ggml_add_backend_library target)
    add_library(${target} OBJECT ${ARGN})
    target_include_directories(${target} PRIVATE ${RNLLAMA_LIB_DIR})
    target_compile_features(${target} PRIVATE cxx_std_17)
    target_compile_options(${target} PRIVATE -O3 -fPIC)
endfunction()
'''
s = shim + s
cmake.write_text(s)
path = package / 'android/src/main/rnllama/CMakeLists.txt'
s = path.read_text()
marker = '# Default target (no specific CPU features)'
block = '''
# GPU fork: standalone native Vulkan build. Existing CPU/OpenCL prebuilts stay intact.
if (RNLLAMA_VULKAN_ONLY)
    build_rnllama_library("rnllama_v8_2_dotprod_i8mm_vulkan" "arm" "-march=armv8.2-a+dotprod+i8mm")
    target_compile_definitions(rnllama_v8_2_dotprod_i8mm_vulkan PRIVATE LM_GGML_USE_VULKAN)
    add_subdirectory(${RNLLAMA_LIB_DIR}/ggml-vulkan ${CMAKE_CURRENT_BINARY_DIR}/vulkan)
    target_link_libraries(rnllama_v8_2_dotprod_i8mm_vulkan PRIVATE ggml-vulkan vulkan)
    return()
endif()

'''
if 'if (RNLLAMA_VULKAN_ONLY)' not in s:
    if marker not in s: raise SystemExit('Native CMake layout changed')
    path.write_text(s.replace(marker, block + marker))
(root / 'src/utils/inference/buildBackend.ts').write_text("// Generated for the Vulkan APK by scripts/vulkan/prepare.py.\nexport const BUILD_BACKEND: 'opencl' | 'vulkan' = 'vulkan';\n")
print('Restored Vulkan source from', REVISION)

# Vulkan 1.1 loader entry points require Android 9; keep the OpenCL APK minimum unchanged.
gradle = root / 'android/build.gradle'
s = gradle.read_text()
if 'minSdkVersion = 24' not in s and 'minSdkVersion = 28' not in s:
    raise SystemExit('Android minimum SDK configuration changed')
gradle.write_text(s.replace('minSdkVersion = 24', 'minSdkVersion = 28'))
