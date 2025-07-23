# 开源 vGPU 方案 HAMI 原理分析 Part1: hami-device-plugin-nvidia

---

本文为开源 vGPU 方案 HAMI 实现原理分析第一篇，主要分析 hami-device-plugin-nvidia 实现原理。

之前在 [开源 vGPU 方案：HAMi，实现细粒度 GPU 切分](https://mp.weixin.qq.com/s/7L6NuSSP_iMwbtooQIJUjw)介绍了HAMi是什么，然后在 [开源 vGPU 方案 HAMi: Core & Memory 隔离测试](https://mp.weixin.qq.com/s/qfdHqpendMC6_zS_isCluw)中对HAMi提供的 vGPU 方案进行了测试。

接下来则是逐步分析 HAMI 中的 vGPU 实现原理，涉及到的东西比较多，暂定分为几部分：

1. **ami-device-plugin-nvidia**：HAMI 版本的 device-plugin 中 GPU 感知以及分配逻辑怎么样实现的，和 NVIDIA 官方的 device-plugin 有何不同。

2. **hami-scheduler**：HAMI 是如何调度调度的，impack/spread 高可用调度策略是怎么实现的

3. **hami-core（也叫作 cgroup-hook)**：这是 HAMI 实现 vGPU 方案核心的部分，HAMI 是如何通过拦截 CUDA 来实现 Core&Memory 等高级限制的

本文为第一篇，分析 hami-device-plugin-nvidia 实现原理。

---

## 1. 概述

NVIDIA 是有自己实现 device-plugin 的，那么问题来了：**HAMI 为什么还要自己实现一个 device plugin 呢？**

是 ***hami-device-plugin-nvidia*** 是有哪些 ***NVIDIA*** 原生 ***device plugin*** 没有的功能吗？带着疑问，我们开始查看 hami-device-plugin-nvidia 源码。

- [GPU 使用指南：如何在裸机、Docker、K8s 等环境中使用 GPU](https://mp.weixin.qq.com/s/A74AxwmdPXtYrz0Syp1aOA)

- [GPU 环境搭建指南：使用 GPU Operator 加速 Kubernetes GPU 环境搭建](https://mp.weixin.qq.com/s/IO3dlhkF5Gu-pNqcS8cmuA)

- [自定义资源支持：K8s Device Plugin 从原理到实现](https://mp.weixin.qq.com/s/a9psDFtQc3f1R5K0EVl4yg)

- [在K8S中Pod是如何使用到GPU的：device plugin & nvidia-container-toolkit 源码分析](https://mp.weixin.qq.com/s/vAPL48cs8pBzsqwlUi1-wA)

> 后续都默认大家都对这块比较熟悉了，特别是后两篇。

---

## 2.程序入口

> 基于HAMi v2.3.13版本

HAMi 首先支持的是NVIDIA GPU，单独实现了一个device plugin nvidia。

- 启动文件在 [`cmd/device-plugin/nvidia`](https://github.com/Project-HAMi/HAMi/tree/master/cmd/device-plugin/nvidia)

- 核心实在在 [`pkg/device-plugin/nvidiadevice`](https://github.com/Project-HAMi/HAMi/tree/master/pkg/device-plugin/nvidiadevice)

> 默认大家都对 k8s 的 device plugin 机制比较熟悉了，因此这里只分析核心代码逻辑，不然篇幅就太长了。

对于一个 device plugin 我们一般关注以下 3 个方法：

- Register：将插件注册到 Kubelet 的，参数 ResourceName 比较重要

- ListAndWatch：device plugin 是怎么感知 GPU 并上报的

- Allocate：device plugin 是如何将 GPU 分配给 Pod 的

启动命令在[`/cmd/device-plugin/nvidia`](https://github.com/Project-HAMi/HAMi/tree/master/cmd/device-plugin/nvidia)，用的是 ***github.com/urfave/cli/v2***构建的一个命令行工具。

启动时做了两件事：

- 将插件注册到Kubelet

- 启动一个gRPC服务

我们只需要关注一下接收的几个参数：

![p1](/images/blog/gpu3/p1.jpg)

- device-split-count：表示 GPU 的分割数，每一张 GPU 都不能分配超过其配置数目的任务。若其配置为 N 的话，每个 GPU 上最多可以同时存在 N 个任务。

建议根据 GPU 性能动态调整，一般建议大于 10。device-memory-scaling：表示 GPU memory 的 oversubscription(超额订阅)** **比例，默认 1.0，大于 1.0 则表示启用虚拟显存（实验功能），不建议修改。device-cores-scaling：表示 GPU core 的 oversubscription(超额订阅)比例，默认 1.0。disable-core-limit：是否关闭 GPU Core Limit，默认 false，不建议修改。resource-name：资源名称，建议改掉，不推荐使用默认的 nvidia.com/gpu 因为这个和 nvidia 原生的重复了。




推荐阅读：
*   GPU 使用指南：如何在裸机、Docker、K8s 等环境中使用 GPU
*   GPU 环境搭建指南：使用 GPU-Operator 加速 Kubernetes GPU 环境搭建
*   自定义资源支持：K8s Device Plugin 从原理到实现
*   在 K8s 中 Pod 是如何使用到 GPU 的：device-plugin & nvidia-container-toolkit 源码分析

后续都默认大家都对这块比较熟悉了，特别是后两篇。

## 2. 程序入口

基于 HAMI v2.3.13 版本

HAMI 首先支持的是 NVIDIA GPU，单独实现了一个 device-plugin-nvidia。
*   启动文件在 `cmd/device-plugin/nvidia`[1]
*   核心实现在 `pkg/device-plugin/nviadia`[2]

默认大家都对 k8s 的 device-plugin 机制比较熟悉了，因此这里只分析核心代码逻辑，不然篇幅就太长了。

对于一个 device-plugin 我们一般关注以下3个方法：
*   **Register**：将插件注册到 Kubelet 的，多数 ResourceName 比较重要
*   **ListAndWatch**：device-plugin 是怎么感知 GPU 并上报的
*   **Allocate**：device-plugin 是如何将 GPU 分配给 Pod 的
