---
title: "HAMI vGPU Principle Analysis Part 5: HAMI-core (libvgpu.so) vCUDA Working Principle Analysis"
coverTitle: "HAMi-Core (ibvgpu.so): How Fine-Grained vGPU Works"
slug: "open-source-vgpu-hami-core-libvgpu-so-vcuda-analysis"
date: "2025-07-28"
excerpt: "This is the fifth article in the HAMI principle analysis series, providing a simple analysis of the working principles of HAMI-Core, including how it takes effect, how CUDA APIs are intercepted, and how it implements resource limits for GPU core and memory."
author: “Dynamia AI Team”
tags: ["HAMi", "GPU Sharing", "vGPU", "Kubernetes", "Heterogeneous Computing"]
coverImage: "/images/blog/gpu7/cover2.jpg"
language: "en"
---

# HAMI vGPU Principle Analysis Part 5: HAMI-core (libvgpu.so) vCUDA Working Principle Analysis

In the last article, we analyzed how advanced scheduling strategies like Spread and Binpack are implemented in `hami-scheduler`.

This is the fifth article in the HAMI principle analysis series, providing a simple analysis of the working principles of HAMI-Core, including how it takes effect, how CUDA APIs are intercepted, and how it implements resource limits for GPU core and memory.

This article is adapted from: https://mp.weixin.qq.com/s/vN3uDRPpAP3UmE2Hgn75vg


![p1](/images/blog/gpu7/p1.jpg)

This article primarily addresses the following questions:

1.  How does `libvgpu.so` take effect?
2.  How are CUDA APIs intercepted?
3.  How is GPU memory limited?
4.  How is GPU core limited?

> I'm not very familiar with C, so if I've made any mistakes, please leave a comment to correct them!

## TL;DR

**How does `libvgpu.so` take effect?**
*   The device plugin, in its `Allocate` method, uses `hostPath` to mount `libvgpu.so` from the host machine into the Pod.
*   It then uses the `LD_PRELOAD` mechanism to ensure the `libvgpu.so` library mounted in the previous step is loaded first, making it effective.

**How are CUDA APIs intercepted?**
*   By overwriting the `dlsym` function to hijack calls to NVIDIA's dynamic libraries (like CUDA and NVML), specifically intercepting functions starting with `cu` and `nvml`.

**How is GPU memory limited?**
*   First, it intercepts `_nvmlDeviceGetMemoryInfo` from the NVML API. This makes the `nvidia-smi` command only display the memory requested by the application (derived from `CUDA_DEVICE_MEMORY_LIMIT_X`).
*   Then, it intercepts memory allocation-related CUDA APIs, such as `cuMemoryAllocate` and `cuMemAlloc_v2`.
*   Before allocating memory, an `oom_check` is added. If the Pod's current GPU memory usage exceeds the specified limit (from `CUDA_DEVICE_MEMORY_LIMIT_X`), it directly returns an OOM error.

**How is GPU core limited?**
*   Similarly, it intercepts CUDA APIs related to submitting kernels, such as `cuLaunchKernel`.
*   Before submitting a kernel, a `rate_limit` logic is added. The algorithm is similar to a token bucket. Each kernel submission consumes a token. When a submission finds no available tokens, it will sleep directly. After a period, tokens are replenished, and tasks can be submitted again.
*   The `CUDA_DEVICE_SM_LIMIT` environment variable is used when replenishing tokens.

---

## 1. How `libvgpu.so` Takes Effect

1.  How is it mounted into the Pod?
2.  How is it put to use?

### How it's mounted into the Pod
This part is handled by the `hami-device-plugin-nvidia` component, specifically in the `Allocate` method. The relevant code is as follows:

```go
// pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go#L385
func (plugin *NvidiaDevicePlugin) Allocate(ctx context.Context, reqs *kubeletdevicepluginv1beta1.AllocateRequest) (*kubeletdevicepluginv1beta1.AllocateResponse, error) {
    // ...
    // Some logic omitted for brevity
    // ...
    response.Mounts = append(response.Mounts,
        &kubeletdevicepluginv1beta1.Mount{ContainerPath: fmt.Sprintf("%s/vgpu/libvgpu.so", hostHookPath),
            HostPath: hostHookPath + "/vgpu/libvgpu.so",
            ReadOnly: true},
        // ... other mounts
    )
    // ...
}
```

The core part:
```go
response.Mounts = append(response.Mounts,
    &kubeletdevicepluginv1beta1.Mount{
        ContainerPath: fmt.Sprintf("%s/vgpu/libvgpu.so", hostHookPath),
        HostPath:      hostHookPath + "/vgpu/libvgpu.so",
        ReadOnly:      true,
    },
)
```
There is an operation to mount `libvgpu.so` using `HostPath`, sourced from an environment variable. In HAMI deployments, `/usr/local` is used by default.

### How it's loaded
In the `hami-device-plugin-nvidia` `Allocate` method, there's also this piece of logic:
```go
found := false
for _, val := range currentCtr.Env {
    if strings.Compare(val.Name, "CUDA_DISABLE_CONTROL") == 0 {
        // If the environment variable exists but is false or fails to parse, ignore it
        t, _ := strconv.ParseBool(val.Value)
        if !t {
            continue
        }
        // Only mark as "found" if the environment variable exists and is true
        found = true
        break
    }
}
if !found {
    response.Mounts = append(response.Mounts,
        &kubeletdevicepluginv1beta1.Mount{
            ContainerPath: "/etc/ld.so.preload",
            HostPath:      hostHookPath + "/vgpu/ld.so.preload",
            ReadOnly:      true,
        },
    )
}```
When the `CUDA_DISABLE_CONTROL=true` environment variable is not manually set to disable HAMI's isolation, the file `/usr/local/vgpu/ld.so.preload` from the host is mounted to `/etc/ld.so.preload` inside the Pod.

In Linux systems, `/etc/ld.so.preload` is a special file. The system will prioritize loading the shared libraries listed in this file when loading shared libraries. This file is typically used to force the loading of specific shared libraries, overriding the default dynamic linking behavior during system startup or program execution.
> The dynamic library loading order in Linux is: `LD_PRELOAD` > `LD_LIBRARY_PATH` > `/etc/ld.so.cache` > `/lib` > `/usr/lib`.

Using `LD_PRELOAD` ensures that our custom `libvgpu.so` is loaded.

Let's check the contents of this file on the host:
```console
root@j99cloudvm:~/lixd/hami# ls /usr/local/vgpu
containers  ld.so.preload  libvgpu.so

root@j99cloudvm:~/lixd/hami# cat /usr/local/vgpu/ld.so.preload
/usr/local/vgpu/libvgpu.so
```
The content is `/usr/local/vgpu/libvgpu.so`, which means this file ensures that the `libvgpu.so` we mounted from the outside is loaded with priority.

**In short: It uses the `LD_PRELOAD` method to load its own implementation of `libvgpu.so`.**

### Core & Memory Thresholds
How does `libvgpu.so` know what limits to set for core and memory?

This is also handled in the `hami-device-plugin-nvidia` `Allocate` method. `Allocate` injects the relevant environment variables into the Pod: `CUDA_DEVICE_MEMORY_LIMIT` and `CUDA_DEVICE_SM_LIMIT`.
```go
for i, dev := range devreq {
    limitKey := fmt.Sprintf("CUDA_DEVICE_MEMORY_LIMIT_%v", i)
    response.Envs[limitKey] = fmt.Sprintf("%vm", dev.Usedmem)
}
response.Envs["CUDA_DEVICE_SM_LIMIT"] = fmt.Sprint(devreq.Usedcores)
```
This way, `libvgpu.so` knows what limits to enforce.

### Summary
This section analyzed how `libvgpu.so` takes effect.
1.  When `hami-device-plugin-nvidia` starts, it copies `libvgpu.so` from its image to the host, by default at `/usr/local/vgpu/libvgpu.so`.
2.  When a Pod is created, the `Allocate` method in `hami-device-plugin-nvidia` uses `hostPath` to mount the `/usr/local/vgpu/libvgpu.so` file from the host into the Pod.
3.  Simultaneously, it uses `/etc/ld.so.preload` to prioritize loading the `libvgpu.so` library mounted in the previous step. This is also done in the `Allocate` method by mounting `/usr/local/vgpu/ld.so.preload` from the host to `/etc/ld.so.preload` in the Pod.

With this, we have achieved priority loading of our custom `libvgpu.so` when loading shared libraries in the Pod.

## 2. How CUDA APIs are Intercepted
This section analyzes how HAMI-Core (`libvgpu.so`) intercepts CUDA APIs.

### Overwriting the `dlsym` function to intercept CUDA APIs
**Overwriting the `dlsym` function**
`dlsym` is a function used for symbol resolution, declared in the `dlfcn.h` header file, applicable to Linux and other POSIX-compliant systems. It allows a program to dynamically load and use symbols from shared libraries at runtime.

HAMi-core overwrites the `dlsym` function to hijack calls to NVIDIA's dynamic libraries (like CUDA and NVML), specifically intercepting functions starting with `cu` and `nvml`.
1.  Initialize `dlsym`.
2.  If the symbol starts with `cu`, handle it specially using `__dlsym_hook_section(handle, symbol)`.
3.  If it starts with `nvml`, handle it specially using `__dlsym_hook_section_nvml(handle, symbol)`.
4.  Finally, if nothing was found before, use the real `dlsym`.

The complete code is as follows:
```c
// src/libvgpu.c#L77-L116
FUNC_ATTR_VISIBLE void* dlsym(void* handle, const char* symbol) {
    pthread_once(&dlsym_init_flag, init_dlsym);
    LOG_DEBUG("into dlsym %s", symbol);

    /* 1. Initialize real_dlsym */
    // ... initialization logic ...

    /* 2. Special handling for cu* symbols */
    if (symbol == 'c' && symbol == 'u') {
        pthread_once(&pre_cuinit_flag, (void(*)(void))preInit);
        void* f = __dlsym_hook_section(handle, symbol);
        if (f != NULL)
            return f;
    }

    /* 3. Special handling for nvml* symbols */
#ifdef HOOK_NVML_ENABLE
    if (symbol == 'n' && symbol == 'v' && symbol == 'm' && symbol == 'l') {
        void* f = __dlsym_hook_section_nvml(handle, symbol);
        if (f != NULL)
            return f;
    }
#endif

    /* 4. Other symbols go through the original dlsym */
    return real_dlsym(handle, symbol);
}
```

### Handling `cu` functions: `__dlsym_hook_section`
`__dlsym_hook_section` defines how to handle symbols starting with `cu`.
> `__dlsym_hook_section_nvml` is similar, so it won't be detailed here.
```c
void* __dlsym_hook_section(void* handle, const char* symbol) {
    int it;

    /* 1. Check if the symbol is in the list of CUDA APIs to be intercepted */
    for (it = 0; it < CUDA_ENTRY_END; it++) {
        if (strcmp(cuda_library_entry[it].name, symbol) == 0) {
            if (cuda_library_entry[it].fn_ptr == NULL) {
                LOG_WARN("NEED TO RETURN NULL");
                return NULL;
            } else {
                break;
            }
        }
    }

    /* 2. Fill the hooked function pointer through macro definitions */
    /* Context */
    DLSYM_HOOK_FUNC(cuCtxGetDevice);
    DLSYM_HOOK_FUNC(cuCtxCreate);
    /* ... */
    DLSYM_HOOK_FUNC(cuGraphDestroy);

#ifdef HOOK_MEMINFO_ENABLE
    DLSYM_HOOK_FUNC(cuMemGetInfo_v2);
#endif

    /* 3. Return NULL if not found */
    return NULL;
}```
The core logic is in `DLSYM_HOOK_FUNC`.

### `DLSYM_HOOK_FUNC` Macro Definition
```c
#define DLSYM_HOOK_FUNC(f)                                           \
    if (0 == strcmp(symbol, #f)) {                                   \
        return (void*) f; }                                          \
```
*   `#f`: This is a special preprocessor operator in the macro that converts the passed parameter `f` into a string literal. For example, `#f` converts `cuGraphDestroy` into the string `"cuGraphDestroy"`.
*   `strcmp(symbol, #f)`: If `symbol` matches the string `#f`, `strcmp` returns 0.
*   `return (void*) f;`: If `strcmp` returns 0, it returns the function pointer corresponding to `f`.

For example, `DLSYM_HOOK_FUNC(cuGraphDestroy);` expands to:
```c
if (0 == strcmp(symbol, "cuGraphDestroy")) {
    return (void*) cuGraphDestroy;
}
```

### `hook.c`
This file uses `dlopen` and `dlsym` to load the CUDA library and redirect CUDA function calls to achieve interception, monitoring, or modification of CUDA function behavior.

First, `cuda_library_entry` defines which CUDA functions need to be intercepted. Then, `load_cuda_libraries` uses `dlopen` to open `libcuda.so.1` and `real_dlsym` to find the address of each function by name and store it in `cuda_library_entry`.

### `libcuda_hook.h`
`src/include/libcuda_hook.h` contains the actual interception implementation for the CUDA functions obtained in the previous step. The basic principle is to redirect CUDA function calls through function pointers.

The `CUDA_OVERRIDE_CALL` macro redirects the CUDA function call via the function pointer in the table. `CUDA_FIND_ENTRY` finds the corresponding function pointer in the table based on the passed function enum.

### Summary
This section explained how HAMI-Core (`libvgpu.so`) intercepts CUDA APIs. The core mechanism is to overwrite the `dlsym` function and replace function addresses.

## 3. How GPU Memory is Limited
This section analyzes how HAMI-Core implements the memory limit. This is divided into two parts: NVML interception and CUDA API interception.

### NVML
When we request 3000MB of memory, running `nvidia-smi` inside the Pod shows exactly 3000MB. This is achieved by intercepting the `_nvmlDeviceGetMemoryInfo` API from NVML.

The intercepted function (`_nvmlDeviceGetMemoryInfo`) gets the limit from the `CUDA_DEVICE_MEMORY_LIMIT_X` environment variable and modifies the `total`, `free`, and `used` fields of the returned `nvmlMemory_t` struct to reflect the virtual limit, not the actual hardware memory.

The limit is read from the environment during initialization and stored in a shared memory region.

### CUDA
#### `cuMemAlloc_v2`
HAMi-Core re-implements relevant methods. For example, `cuMemAlloc_v2` eventually calls `add_chunk`, which contains a custom validation logic:
```c
if (oom_check(dev, size)) {
    return -1;
}
```

#### `oom_check`
`oom_check`'s implementation:
```c
int oom_check(const int dev, size_t addon) {
    // ...
    uint64_t limit = get_current_device_memory_limit(d);
    size_t _usage = get_gpu_memory_usage(d);

    if (limit == 0) {
        return 0;
    }

    size_t new_allocated = _usage + addon;
    if (new_allocated > limit) {
        LOG_ERROR("Device %d OOM %zu / %zu", d, new_allocated, limit);
        
        // ... try to clean up resources from quit processes ...
        
        return 1;
    }
    return 0;
}
```
If the new allocation exceeds the limit, it will eventually return `1`, causing the allocation to fail with an OOM error. This is how the memory limit is enforced.

## 4. How GPU Core is Limited
This section analyzes how HAMI-Core implements the core limit.

### What is a Kernel?
In CUDA programming, a Kernel is a function executed in parallel on the GPU. The process of launching a kernel is what truly utilizes the GPU.

HAMi-Core limits the submission of kernels to achieve the core limit. The algorithm is similar to a token bucket: each kernel submission consumes a token. If no tokens are available, the process sleeps until tokens are replenished.

### `cuLaunchKernel`
`cuLaunchKernel` is the CUDA API for launching a kernel. HAMI-Core's custom `cuLaunchKernel` method adds a `rate_limiter` logic to implement the core limit.

```c
CUresult cuLaunchKernel(...) {
    ENSURE_RUNNING();
    pre_launch_kernel();
    if (pidfound == 1) {
        rate_limiter(gridDimX * gridDimY * gridDimZ,
                     blockDimX * blockDimY * blockDimZ);
    }
    CUresult res = CUDA_OVERRIDE_CALL(cuda_library_entry,
                                      cuLaunchKernel,
                                      ...);
    return res;
}
```

### Core Logic: `rate_limiter`
The `rate_limiter` compares the current usage with the limit obtained from the environment variable. Each kernel submission decrements `g_cur_cuda_cores`. If it falls below zero, the process is blocked (`nanosleep`). In the next time slice, `g_cur_cuda_cores` is restored.

```c
void rate_limiter(int grids, int blocks) {
    // ...
    if ((get_current_device_sm_limit(0) >= 100) || (get_current_device_sm_limit(0) == 0))
        return;
    // ...
    do {
CHECK:
        before_cuda_cores = g_cur_cuda_cores;
        LOG_DEBUG("current core: %d", g_cur_cuda_cores);
        if (before_cuda_cores < 0) {
            nanosleep(&g_cycle, NULL);
            goto CHECK;
        }
        after_cuda_cores = before_cuda_cores - kernel_size;
    } while (!CAS(&g_cur_cuda_cores, before_cuda_cores, after_cuda_cores));
}
```
The limit is obtained from the `CUDA_DEVICE_SM_LIMIT` environment variable. The `do-while` loop with `CAS` (Compare And Swap) ensures that the token update is atomic. The sleep duration is a constant 10 milliseconds.

### Token Replenishment Logic
A background thread running the `utilization_watcher` function continuously monitors GPU utilization.
```c
void* utilization_watcher() {
    // ...
    int upper_limit = get_current_device_sm_limit(0);
    // ...
    while (1) {
        nanosleep(&g_wait, NULL);
        // ... get current utilization ...
        share = delta(upper_limit, userutil, share);
        change_token(share);
    }
}
```
It calculates how many tokens to add back in each cycle using the `delta` function and then calls `change_token` to replenish the tokens. The `delta` function calculates the increment based on the difference between the target utilization (`upper_limit`) and the current utilization.

This is consistent with the test results from [Open Source vGPU Solution HAMI: Core & Memory Isolation Test](https://dynamia.ai/blog/open-source-vgpu-hami-core-memory-test), where the GPU utilization might exceed the threshold in the short term, but over a longer period, the average value fluctuates around the threshold.

![p3](/images/blog/gpu7/p3.jpg)
> The image above shows the test result when the GPU Core Limit is set to 30.

## 5. Summary
This article has mainly analyzed the working principle of HAMI-Core. HAMI's compute power limitation uses a token bucket-like mechanism to restrict a process's kernel submissions. Submitting a GPU task consumes a token. Once the tokens are exhausted, submission is blocked until tokens are replenished in the next round.

#### Now we can answer the questions from the beginning:

#### How does `libvgpu.so` take effect?
1.  The device plugin uses `hostPath` to mount `libvgpu.so` from the host into the Pod.
2.  It uses the `LD_PRELOAD` mechanism to prioritize the loading of the mounted `libvgpu.so` library.
3.  It specifies the Memory and Core thresholds by injecting the `CUDA_DEVICE_MEMORY_LIMIT_X` and `CUDA_DEVICE_SM_LIMIT` environment variables.

#### How are CUDA APIs intercepted?
*   By overwriting the `dlsym` function to hijack calls to NVIDIA's dynamic libraries (like CUDA and NVML), specifically intercepting functions starting with `cu` and `nvml`.

#### How is GPU memory limited?
*   First, it intercepts `_nvmlDeviceGetMemoryInfo` from the NVML API to make `nvidia-smi` display the requested memory (from `CUDA_DEVICE_MEMORY_LIMIT_X`).
*   Then, it intercepts memory allocation-related CUDA APIs like `cuMemoryAllocate` and `cuMemAlloc_v2`.
*   Before allocating memory, an `oom_check` is performed. If the Pod's current GPU memory usage exceeds the limit (from `CUDA_DEVICE_MEMORY_LIMIT_X`), it directly returns an OOM error.

#### How is GPU core limited?
*   Similarly, it intercepts CUDA APIs related to kernel submission, such as `cuLaunchKernel`.
*   Before submitting a kernel, a `rate_limit` logic is added. The algorithm is like a token bucket. Each kernel submission consumes a token. When no tokens are available, the process sleeps. After a period, tokens are replenished, and tasks can be submitted again.
*   The `CUDA_DEVICE_SM_LIMIT` environment variable is used when replenishing tokens.

---
*To learn more about the HAMI project, please visit the [GitHub repository](https://github.com/Project-HAMi/HAMi) or join our [Slack community](https://cloud-native.slack.com/archives/C07T10BU4R2).*
---

