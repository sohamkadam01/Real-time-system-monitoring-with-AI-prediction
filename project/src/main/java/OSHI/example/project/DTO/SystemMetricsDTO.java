package OSHI.example.project.DTO;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class SystemMetricsDTO {
    private DashboardDTO dashboard;
    private CpuDetailsDTO cpu;
    private MemoryDetailsDTO memory;
    private List<DiskDTO> disks;
    private List<NetworkDTO> networks;
    private List<ProcessDTO> processes;
    private List<AlertDTO> alerts;
    private SystemInfoDTO systemInfo;
}