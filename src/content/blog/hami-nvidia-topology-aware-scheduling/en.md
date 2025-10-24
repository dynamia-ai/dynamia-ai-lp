---
title: "Deep Dive: HAMi × NVIDIA | GPU Topology-Aware Scheduling Implementation"
slug: "hami-nvidia-topology-aware-scheduling-deep-dive"
date: "2025-10-22"
excerpt: "HAMi v2.7.0 introduces topology-aware scheduling for NVIDIA GPUs. This article provides an in-depth code analysis of HAMi's design and implementation principles for topology-aware scheduling, explaining how intelligent scheduling precisely deploys compute tasks on the most tightly connected GPU combinations."
author: "Dynamia AI Team"
tags: ["HAMi", "NVIDIA", "GPU Topology", "Scheduling", "Deep Dive", "Technical Analysis", "NVLink", "PCIe", "Kubernetes"]
coverImage: "/images/blog/hami-nvidia-topology/cover-en.png"
language: "en"
---
# Deep Dive: HAMi × NVIDIA | GPU Topology-Aware Scheduling Implementation

The HAMi community officially released **topology-aware scheduling** for NVIDIA GPUs in v2.7.0. This feature primarily addresses multi-GPU communication bottlenecks in high-performance computing (HPC) and large-scale AI training scenarios. Through intelligent scheduling, it precisely deploys compute tasks on GPU combinations with the tightest physical connections and fastest communication speeds, thereby maximizing compute acceleration and improving overall cluster efficiency.

Building on the feature introduction, this article dives deep into the code implementation, providing a detailed analysis of HAMi's specific design and implementation principles for NVIDIA GPU topology-aware scheduling.

## 1. Core Features Overview

1. **Dynamic Topology Score Calculation**: The Device Plugin dynamically probes the physical connection topology between GPUs on a node (e.g., NVLink, PCIe) via NVML and quantifies it as "communication scores" between devices, providing a basis for scheduling decisions.
2. **Dual-Strategy Anti-Fragmentation Scheduling**: The `Fit` function has a built-in "forward-thinking" optimization algorithm. For "multi-GPU tasks" and "single-GPU tasks," it automatically applies "best-fit" and "minimal-disruption" strategies to protect the long-term health of cluster topology resources.

## 2. Core Principles

HAMi's topology-aware scheduling for NVIDIA GPUs follows a core design philosophy: first, locally on the node, precisely quantify the complex physical topology as "communication scores" between devices. Then, during scheduling decisions, make the final, optimal choice based on these scores.

![Topology-Aware Scheduling Architecture](/images/blog/hami-nvidia-topology/1761119583763.png)

The core is divided into two stages: "Topology Registration" and "Scheduling Decision":

### Stage 1: Topology Registration — Quantifying Physical Topology

The goal of this stage is to transform the invisible GPU physical connections on a node into standardized numerical scores that scheduling logic can understand.

1. **Information Probing**: On each GPU node, the Device Plugin obtains the physical connection type (NVLink or PCIe) between all GPU pairs via NVIDIA's NVML.
2. **Data Modeling and Quantification**: The probed results are not built into a simple "connection matrix" but through a more refined two-step process:
   - **Building the Topology Graph**: First, the code constructs a complete GPU topology graph in memory, containing detailed connection information between all GPUs.
   - **Quantifying to Scores**: Then, the algorithm traverses this topology graph and, according to preset rules (e.g., `SingleNVLINKLink` gets 100 points, `P2PLinkCrossCPU` gets 10 points), calculates and converts the connection relationship between any two GPUs into a specific "communication score".
3. **Final Product — Device Score Table**: The final product is a "device score table." This table records each GPU's UUID and its communication score with all other GPUs, and is registered in the node's Annotation.

### Stage 2: Scheduling Decision — Intelligent Selection of Optimal Solution

When the scheduler receives a task, it delegates the question of "how to select devices," along with the node's "device score table," to the device-side `Fit` function.

1. **Filtering**: The `Fit` function first filters out GPUs that do not meet basic resource requirements (e.g., memory, compute).
2. **Scoring and Optimization**: Then, the `Fit` function, based on the "device score table," executes a built-in optimization algorithm that considers "best-fit" and "minimal-disruption" principles, calculates the optimal combination among all eligible GPUs, and returns the result to the scheduler.

## 3. Implementation Principles: Deep Code Analysis

### 1. Topology Discovery and Score Calculation

The discovery and quantification of topology information is the foundation for all subsequent intelligent decisions. The entire process is completed locally by the Device Plugin and ultimately generates a score table that can be reported.

#### Building the Topology Graph (`build()` function)

This logic is mainly implemented by the `build()` function in `pkg/device/nvidia/calculate_score.go`. It does not build a simple connection matrix, but rather:

- **Initialize Device List**: Creates a `DeviceList` where each `Device` object contains an empty `Links` map (`map[int][]P2PLink`).
- **Traverse and Populate**: Through a double loop, traverse all GPU pairs (`d1`, `d2`) and call `GetP2PLink` and `GetNVLink` (these two functions are implemented in `links.go`).
- **Aggregate Connection Information**: Append all detected connections (including PCIe and NVLink) as `P2PLink` objects to the corresponding `Device`'s `Links` map. This constructs a complete topology graph in memory with rich connection information.

#### Quantifying to Scores (`calculateGPUPairScore()` function)

After the topology graph is built, the `calculateGPUScore` function calls `calculateGPUPairScore` to convert the connection relationships in the graph to numerical scores.

This function checks all connections between two GPUs and scores them according to a detailed `switch` statement. For example, `P2PLinkSameBoard` gets 60 points, `SingleNVLINKLink` gets 100 points, and `TwoNVLINKLinks` gets 200 points. The final score is the sum of all connection scores.

```go
// File: pkg/device/nvidia/calculate_score.go

func (o *deviceListBuilder) build() (DeviceList, error) {
        // ...
        // 1. Initialize a flat DeviceList
        var devices DeviceList
        for i, d := range nvmlDevices {
                // ... create device object ...
                devices = append(devices, device)
        }

        // 2. Traverse and populate Links map
        for i, d1 := range nvmlDevices {
                for j, d2 := range nvmlDevices {
                        if i != j {
                                // Get and append P2P Link info
                                p2plink, _ := GetP2PLink(d1, d2)
                                devices[i].Links[j] = append(devices[i].Links[j], P2PLink{devices[j], p2plink})
  
                                // Get and append NVLink info
                                nvlink, _ := GetNVLink(d1, d2)
                                devices[i].Links[j] = append(devices[i].Links[j], P2PLink{devices[j], nvlink})
                        }
                }
        }
        return devices, nil
}

func calculateGPUPairScore(gpu0 *Device, gpu1 *Device) int {
        score := 0
        for _, link := range gpu0.Links[gpu1.Index] {
                switch link.Type {
                case P2PLinkCrossCPU: score += 10
                // ... (etc) ...
                case SingleNVLINKLink: score += 100
                // ... (etc) ...
                }
        }
        return score
}
```

### 2. Device-Side Scheduling Decision: Dual-Strategy Topology Optimization

The core logic of scheduling decisions resides in the device-side `Fit()` function in `pkg/device/nvidia/device.go`. When this function recognizes the need for topology-aware scheduling via Annotation, it automatically switches optimization strategies based on the node's reported "device score table" and the number of requested GPUs.

```go
// File: pkg/device/nvidia/device.go

func (nv *NvidiaGPUDevices) Fit(...) {
        // ...
        needTopology := util.GetGPUSchedulerPolicyByPod(device.GPUSchedulerPolicy, pod) == util.GPUSchedulerPolicyTopology.String()
        // ...
        // (Filter all idle GPUs meeting basic conditions: tmpDevs)
        // ...
        if needTopology {
                if len(tmpDevs[k.Type]) > int(originReq) {
                        if originReq == 1 {
                                // Single-GPU task
                                lowestDevices := computeWorstSignleCard(nodeInfo, request, tmpDevs)
                                tmpDevs[k.Type] = lowestDevices
                        } else {
                                // Multi-GPU task
                                combinations := generateCombinations(request, tmpDevs)
                                combination := computeBestCombination(nodeInfo, combinations)
                                tmpDevs[k.Type] = combination
                        }
                        return true, tmpDevs, ""
                }
        }
        // ...
}
```

The overall decision logic of the `Fit` function can be summarized in the following diagram:

![Fit Function Decision Flow](/images/blog/hami-nvidia-topology/1761119754698.png)

#### Strategy 1: "Best-Fit" Principle for Multi-GPU Tasks

When a Pod requests more than 1 GPU, the algorithm's goal is to find the GPU combination with the highest internal communication score total.

**Code Implementation**: The `Fit` function first identifies all idle GPUs on the node that meet basic resource requirements. Then:

- Calls the `generateCombinations` function to find all possible combinations of these idle GPUs.
- Calls the `computeBestCombination` function, which traverses all these combinations and, using the "device score table," calculates the sum of scores for all device pairs within each combination.
- Finally, the `Fit` function selects the combination with the highest score sum as the allocation result. This ensures tasks are allocated to the GPU "cluster" with the tightest internal connections and highest communication efficiency.

The core optimization logic is as follows:

![Multi-GPU Best Fit](/images/blog/hami-nvidia-topology/1761119764829.png)

#### Strategy 2: "Minimal-Disruption" Principle for Single-GPU Tasks

When a Pod only requests 1 GPU, the algorithm's goal shifts to selecting a GPU with the most "distant" connections to other available GPUs, to protect topology integrity.

**Code Implementation**: The `Fit` function calls the `computeWorstSignleCard` function. This function traverses all available individual GPUs and, using the "device score table," calculates the sum of scores between each GPU and all other available GPUs. Finally, it selects the GPU with the lowest total score. This card is usually located at the "edge" of the topology, and allocating it causes minimal disruption to the overall topology network.

The core optimization logic is as follows:

![Single-GPU Minimal Disruption](/images/blog/hami-nvidia-topology/1761119772158.png)

## 4. Usage

Users only need one Annotation to enable topology-aware scheduling. The scheduler automatically applies the "best-fit" or "minimal-disruption" strategy based on the number of GPUs requested by the task.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-topology-aware-job
  annotations:
    # Enable "topology-aware" scheduling policy.
    hami.io/gpu-scheduler-policy: "topology-aware"
    # The scheduler will automatically, based on communication scores between devices,
    # select the combination with the tightest internal connections for multi-GPU tasks,
    # or select the device causing minimal topology disruption for single-GPU tasks.
spec:
  containers:
  - name: cuda-container
    image: nvidia/cuda:11.6.2-base-ubuntu20.04
    command: ["sleep", "infinity"]
    resources:
      limits:
        # Request 4 GPUs
        nvidia.com/gpu: "4"
```

## 5. Summary

HAMi's topology-aware scheduling for NVIDIA GPUs embodies a clear engineering philosophy: **replace static configuration with dynamic discovery, and replace short-sighted allocation with forward-looking decisions**. Its device-side dual-strategy optimization algorithm, by consuming pre-calculated "communication scores," balances both the ultimate performance of current tasks and the long-term health of cluster resources, forming a mature and efficient GPU scheduling solution that provides solid performance guarantees for users running large-scale AI training and HPC tasks in cloud-native environments.

---

**References**

* **Design Document**: [NVIDIA GPU Topology Scheduler](https://github.com/Project-HAMi/HAMi/blob/master/docs/proposals/gpu-topo-policy.md)
* **User Guide**: [NVIDIA GPU Topology Scheduler Enablement Guide](https://github.com/Project-HAMi/HAMi/blob/master/docs/proposals/nvidia-gpu-topology-scheduler_cn.md)
* **Related PRs**:
  * [https://github.com/Project-HAMi/HAMi/pull/1018](https://github.com/Project-HAMi/HAMi/pull/1018)
  * [https://github.com/Project-HAMi/HAMi/pull/1276](https://github.com/Project-HAMi/HAMi/pull/1276)

Once again, sincere thanks to community developers @lengrongfu and @fyp711 for their contributions to this feature!
