import { z } from "zod";

export const runVMNodeSchema = z.object({
  vm_name: z.string().min(1, "VM name is required"),
  os_type: z.enum(["ubuntu", "centos", "debian", "alpine"]).default("ubuntu"),
  os_version: z.string().default("20.04"),
  cpu_cores: z.number().min(1).max(16).default(1),
  memory_mb: z.number().min(256).max(16384).default(512),
  disk_gb: z.number().min(1).max(1000).default(5),
  auto_start: z.boolean().default(true),
  network_ports: z.array(z.number()).default([]),
  environment: z.record(z.string(), z.string()).default({}),
  continueOnError: z.boolean().default(false),
});

export type RunVMNodeConfig = z.infer<typeof runVMNodeSchema>;

export const runVMNodeDefaultConfig: RunVMNodeConfig = {
  vm_name: "test-vm",
  os_type: "ubuntu",
  os_version: "20.04",
  cpu_cores: 1,
  memory_mb: 512,
  disk_gb: 5,
  auto_start: true,
  network_ports: [3000, 5000],
  environment: {
    TEST_ENV: "development"
  },
  continueOnError: false,
};
