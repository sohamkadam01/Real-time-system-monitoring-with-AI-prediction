package OSHI.example.project.Service;

import oshi.SystemInfo;
import oshi.hardware.*;
import oshi.software.os.*;
import org.springframework.stereotype.Service;

import OSHI.example.project.DTO.AlertDTO;
import OSHI.example.project.DTO.CpuDetailsDTO;
import OSHI.example.project.DTO.DashboardDTO;
import OSHI.example.project.DTO.DiskDTO;
import OSHI.example.project.DTO.MemoryDetailsDTO;
import OSHI.example.project.DTO.NetworkDTO;
import OSHI.example.project.DTO.ProcessDTO;
import OSHI.example.project.DTO.SystemInfoDTO;
import OSHI.example.project.DTO.SystemMetricsDTO;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SystemMonitoringService {
    
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hardware;
    private final OperatingSystem os;
    
    // Alert thresholds
    private static final double CPU_CRITICAL = 90.0;
    private static final double CPU_WARNING = 70.0;
    private static final double MEMORY_CRITICAL = 90.0;
    private static final double MEMORY_WARNING = 80.0;
    private static final double TEMP_CRITICAL = 80.0;
    private static final double TEMP_WARNING = 70.0;
    private static final double DISK_CRITICAL = 95.0;
    private static final double DISK_WARNING = 90.0;
    
    private long[] previousCpuTicks;
    
    public SystemMonitoringService() {
        this.systemInfo = new SystemInfo();
        this.hardware = systemInfo.getHardware();
        this.os = systemInfo.getOperatingSystem();
        this.previousCpuTicks = hardware.getProcessor().getSystemCpuLoadTicks();
    }
    
    public SystemMetricsDTO getSystemMetrics() {
        SystemMetricsDTO metrics = new SystemMetricsDTO();
        
        // Calculate CPU usage
        double cpuLoad = calculateCpuUsage();
        
        // Set dashboard metrics
        metrics.setDashboard(getDashboardMetrics(cpuLoad));
        
        // Set CPU details
        metrics.setCpu(getCpuDetails(cpuLoad));
        
        // Set memory details
        metrics.setMemory(getMemoryDetails());
        
        // Set disk information
        metrics.setDisks(getDiskInfo());
        
        // Set network information
        metrics.setNetworks(getNetworkInfo());
        
        // Set top processes
        metrics.setProcesses(getTopProcesses(10));
        
        // Set alerts
        metrics.setAlerts(getSystemAlerts(cpuLoad));
        
        // Set system info
        metrics.setSystemInfo(getSystemInfo());
        
        return metrics;
    }
    
    private DashboardDTO getDashboardMetrics(double cpuLoad) {
        DashboardDTO dashboard = new DashboardDTO();
        GlobalMemory memory = hardware.getMemory();
        Sensors sensors = hardware.getSensors();
        
        long usedMemory = memory.getTotal() - memory.getAvailable();
        double memoryUsagePercent = (usedMemory / (double) memory.getTotal()) * 100;
        
        dashboard.setCpuUsage(cpuLoad);
        dashboard.setMemoryUsage(memoryUsagePercent);
        dashboard.setCpuTemperature(sensors.getCpuTemperature());
        dashboard.setRunningProcesses(os.getProcessCount());
        dashboard.setSystemUptime(formatUptime(os.getSystemUptime()));
        dashboard.setStatus(getOverallStatus(cpuLoad, memoryUsagePercent));
        
        return dashboard;
    }
    
   private CpuDetailsDTO getCpuDetails(double cpuLoad) {
    CpuDetailsDTO cpuDetails = new CpuDetailsDTO();
    CentralProcessor cpu = hardware.getProcessor();
    
    cpuDetails.setName(cpu.getProcessorIdentifier().getName());
    cpuDetails.setPhysicalCores(cpu.getPhysicalProcessorCount());
    cpuDetails.setLogicalCores(cpu.getLogicalProcessorCount());
    cpuDetails.setCurrentFrequency(formatHertz(cpu.getProcessorIdentifier().getVendorFreq()));
    cpuDetails.setMaxFrequency(formatHertz(cpu.getMaxFreq()));
    
    // Load averages - IMPROVED: Handle -1 values
    double[] loadAvg = cpu.getSystemLoadAverage(3);
    // Create a safe array with default values
    double[] safeLoadAvg = new double[3];
    if (loadAvg != null && loadAvg.length >= 3) {
        // OSHI returns -1 for unavailable load averages
        safeLoadAvg[0] = loadAvg[0] >= 0 ? loadAvg[0] : 0.0;
        safeLoadAvg[1] = loadAvg[1] >= 0 ? loadAvg[1] : 0.0;
        safeLoadAvg[2] = loadAvg[2] >= 0 ? loadAvg[2] : 0.0;
    }
    cpuDetails.setLoadAverages(safeLoadAvg);
    
    // Per core usage - FIXED HERE
    double[] perCoreLoad = new double[0];
    try {
        perCoreLoad = cpu.getProcessorCpuLoad(1000);
    } catch (Exception e) {
        perCoreLoad = new double[cpu.getLogicalProcessorCount()];
        double perCore = cpuLoad / 100.0 / perCoreLoad.length;
        Arrays.fill(perCoreLoad, perCore);
    }
    cpuDetails.setPerCoreUsage(perCoreLoad);
    
    // CPU ticks
    long[] ticks = cpu.getSystemCpuLoadTicks();
    Map<String, Long> tickMap = new HashMap<>();
    for (CentralProcessor.TickType type : CentralProcessor.TickType.values()) {
        tickMap.put(type.name(), ticks[type.getIndex()]);
    }
    cpuDetails.setCpuTicks(tickMap);
    
    // Update previous ticks for next call
    previousCpuTicks = ticks;
    
    return cpuDetails;
}
    
    private MemoryDetailsDTO getMemoryDetails() {
        MemoryDetailsDTO memoryDetails = new MemoryDetailsDTO();
        GlobalMemory memory = hardware.getMemory();
        VirtualMemory virtualMemory = memory.getVirtualMemory();
        
        long usedMemory = memory.getTotal() - memory.getAvailable();
        double memoryUsagePercent = (usedMemory / (double) memory.getTotal()) * 100;
        
        memoryDetails.setTotal(memory.getTotal());
        memoryDetails.setUsed(usedMemory);
        memoryDetails.setAvailable(memory.getAvailable());
        memoryDetails.setUsagePercentage(memoryUsagePercent);
        memoryDetails.setSwapTotal(virtualMemory.getSwapTotal());
        memoryDetails.setSwapUsed(virtualMemory.getSwapUsed());
        
        return memoryDetails;
    }
    
    private List<DiskDTO> getDiskInfo() {
        List<DiskDTO> disks = new ArrayList<>();
        List<OSFileStore> fileStores = os.getFileSystem().getFileStores();
        
        for (OSFileStore fs : fileStores) {
            DiskDTO disk = new DiskDTO();
            double usagePercent = ((fs.getTotalSpace() - fs.getFreeSpace()) / (double) fs.getTotalSpace()) * 100;
            
            disk.setName(fs.getName());
            disk.setMountPoint(fs.getMount());
            disk.setType(fs.getType());
            disk.setTotalSpace(fs.getTotalSpace());
            disk.setFreeSpace(fs.getFreeSpace());
            disk.setUsedSpace(fs.getTotalSpace() - fs.getFreeSpace());
            disk.setUsagePercentage(usagePercent);
            disk.setStatus(getDiskStatus(usagePercent));
            
            disks.add(disk);
        }
        
        return disks;
    }
    
    private List<NetworkDTO> getNetworkInfo() {
        List<NetworkDTO> networks = new ArrayList<>();
        
        for (NetworkIF net : hardware.getNetworkIFs()) {
            if (net.getName().contains("Loopback") || net.getName().contains("lo")) {
                continue;
            }
            
            NetworkDTO network = new NetworkDTO();
            network.setName(net.getName());
            network.setDisplayName(net.getDisplayName());
            network.setBytesSent(net.getBytesSent());
            network.setBytesReceived(net.getBytesRecv());
            
            // Calculate speeds (would need previous values for accurate calculation)
            network.setUploadSpeed(0);
            network.setDownloadSpeed(0);
            
            networks.add(network);
        }
        
        return networks;
    }
    
    private List<ProcessDTO> getTopProcesses(int limit) {
        return os.getProcesses((p) -> true, null, 0)
                .stream()
                .sorted((p1, p2) -> Double.compare(
                    p2.getProcessCpuLoadCumulative(), 
                    p1.getProcessCpuLoadCumulative()))
                .limit(limit)
                .map(this::convertToProcessDTO)
                .collect(Collectors.toList());
    }
    
    private List<AlertDTO> getSystemAlerts(double cpuLoad) {
        List<AlertDTO> alerts = new ArrayList<>();
        
        // CPU alert
        if (cpuLoad >= CPU_CRITICAL) {
            alerts.add(createAlert("CPU", "CRITICAL", 
                String.format("CPU usage critical: %.1f%%", cpuLoad), 
                cpuLoad, CPU_CRITICAL));
        } else if (cpuLoad >= CPU_WARNING) {
            alerts.add(createAlert("CPU", "WARNING", 
                String.format("CPU usage high: %.1f%%", cpuLoad), 
                cpuLoad, CPU_WARNING));
        }
        
        // Memory alert
        GlobalMemory memory = hardware.getMemory();
        long usedMemory = memory.getTotal() - memory.getAvailable();
        double memoryUsagePercent = (usedMemory / (double) memory.getTotal()) * 100;
        
        if (memoryUsagePercent >= MEMORY_CRITICAL) {
            alerts.add(createAlert("MEMORY", "CRITICAL", 
                String.format("Memory usage critical: %.1f%%", memoryUsagePercent), 
                memoryUsagePercent, MEMORY_CRITICAL));
        } else if (memoryUsagePercent >= MEMORY_WARNING) {
            alerts.add(createAlert("MEMORY", "WARNING", 
                String.format("Memory usage high: %.1f%%", memoryUsagePercent), 
                memoryUsagePercent, MEMORY_WARNING));
        }
        
        // Temperature alert
        Sensors sensors = hardware.getSensors();
        double cpuTemp = sensors.getCpuTemperature();
        
        if (cpuTemp >= TEMP_CRITICAL) {
            alerts.add(createAlert("TEMPERATURE", "CRITICAL", 
                String.format("CPU temperature critical: %.1f°C", cpuTemp), 
                cpuTemp, TEMP_CRITICAL));
        } else if (cpuTemp >= TEMP_WARNING && cpuTemp > 0) {
            alerts.add(createAlert("TEMPERATURE", "WARNING", 
                String.format("CPU temperature high: %.1f°C", cpuTemp), 
                cpuTemp, TEMP_WARNING));
        }
        
        // Disk alerts
        for (OSFileStore fs : os.getFileSystem().getFileStores()) {
            double usagePercent = ((fs.getTotalSpace() - fs.getFreeSpace()) / (double) fs.getTotalSpace()) * 100;
            if (usagePercent >= DISK_CRITICAL) {
                alerts.add(createAlert("DISK", "CRITICAL", 
                    String.format("Disk %s critical: %.1f%% full", fs.getName(), usagePercent), 
                    usagePercent, DISK_CRITICAL));
            } else if (usagePercent >= DISK_WARNING) {
                alerts.add(createAlert("DISK", "WARNING", 
                    String.format("Disk %s almost full: %.1f%% full", fs.getName(), usagePercent), 
                    usagePercent, DISK_WARNING));
            }
        }
        
        // Process count alert
        if (os.getProcessCount() > 300) {
            alerts.add(createAlert("PROCESSES", "WARNING", 
                String.format("High process count: %d", os.getProcessCount()), 
                os.getProcessCount(), 300));
        }
        
        return alerts;
    }
    
    private SystemInfoDTO getSystemInfo() {
        SystemInfoDTO systemInfoDTO = new SystemInfoDTO();
        systemInfoDTO.setTimestamp(new Date());
        systemInfoDTO.setOsName(os.getFamily());
        systemInfoDTO.setOsVersion(os.getVersionInfo().getVersion());
        systemInfoDTO.setOsManufacturer(os.getManufacturer());
        systemInfoDTO.setSystemManufacturer(hardware.getComputerSystem().getManufacturer());
        systemInfoDTO.setSystemModel(hardware.getComputerSystem().getModel());
        
        return systemInfoDTO;
    }
    
    private double calculateCpuUsage() {
        CentralProcessor cpu = hardware.getProcessor();
        long[] prevTicks = previousCpuTicks;
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        double cpuLoad = cpu.getSystemCpuLoadBetweenTicks(prevTicks) * 100;
        previousCpuTicks = cpu.getSystemCpuLoadTicks();
        return cpuLoad;
    }
    
    private ProcessDTO convertToProcessDTO(OSProcess process) {
        ProcessDTO dto = new ProcessDTO();
        dto.setPid(process.getProcessID());
        dto.setName(process.getName());
        dto.setCpuUsage(process.getProcessCpuLoadCumulative() * 100);
        dto.setMemoryUsage(process.getResidentSetSize());
        dto.setState(process.getState().name());
        dto.setThreadCount(process.getThreadCount());
        return dto;
    }
    
    private AlertDTO createAlert(String type, String level, String message, double value, double threshold) {
        AlertDTO alert = new AlertDTO();
        alert.setType(type);
        alert.setLevel(level);
        alert.setMessage(message);
        alert.setValue(value);
        alert.setThreshold(String.valueOf(threshold));
        alert.setTimestamp(System.currentTimeMillis());
        return alert;
    }
    
    private String getOverallStatus(double cpuUsage, double memoryUsage) {
        if (cpuUsage >= CPU_CRITICAL || memoryUsage >= MEMORY_CRITICAL) {
            return "CRITICAL";
        } else if (cpuUsage >= CPU_WARNING || memoryUsage >= MEMORY_WARNING) {
            return "WARNING";
        }
        return "HEALTHY";
    }
    
    private String getDiskStatus(double usagePercentage) {
        if (usagePercentage >= DISK_CRITICAL) {
            return "CRITICAL";
        } else if (usagePercentage >= DISK_WARNING) {
            return "WARNING";
        }
        return "HEALTHY";
    }
    
    // Helper formatting methods
    private static String formatBytes(long bytes) {
        if (bytes < 0) return "N/A";
        double value = bytes;
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int i = 0;
        while (value >= 1024 && i < units.length - 1) {
            value /= 1024;
            i++;
        }
        return String.format("%.1f %s", value, units[i]);
    }
    
    private static String formatHertz(long hertz) {
        if (hertz < 0) return "N/A";
        if (hertz < 1000) return hertz + " Hz";
        double value = hertz / 1000.0;
        if (value < 1000) return String.format("%.1f KHz", value);
        value /= 1000.0;
        if (value < 1000) return String.format("%.1f MHz", value);
        value /= 1000.0;
        return String.format("%.1f GHz", value);
    }
    
    private static String formatUptime(long seconds) {
        if (seconds < 60) return seconds + " seconds";
        
        long days = seconds / (24 * 3600);
        long hours = (seconds % (24 * 3600)) / 3600;
        long minutes = (seconds % 3600) / 60;
        
        if (days > 0) {
            return String.format("%d days, %02d:%02d", days, hours, minutes);
        } else if (hours > 0) {
            return String.format("%02d:%02d", hours, minutes);
        } else {
            return String.format("%d minutes", minutes);
        }
    }
}