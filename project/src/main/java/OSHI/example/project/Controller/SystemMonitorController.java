package OSHI.example.project.Controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import OSHI.example.project.DTO.SystemMetricsDTO;
import OSHI.example.project.Service.SystemMonitoringService;

import java.util.Map;

@RestController
@RequestMapping("/api/monitor")
// @CrossOrigin(origins = "*")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
public class SystemMonitorController {
    
    @Autowired
    private SystemMonitoringService monitoringService;
    
    @GetMapping("/metrics")
    public SystemMetricsDTO getSystemMetrics() {
        return monitoringService.getSystemMetrics();
    }
    
    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "dashboard", metrics.getDashboard(),
            "alerts", metrics.getAlerts(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }
    
    @GetMapping("/cpu")
    public Map<String, Object> getCpuMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "cpu", metrics.getCpu(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }
    
    @GetMapping("/memory")
    public Map<String, Object> getMemoryMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "memory", metrics.getMemory(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }
    
    @GetMapping("/disks")
    public Map<String, Object> getDiskMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "disks", metrics.getDisks(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }
    
    @GetMapping("/processes")
    public Map<String, Object> getProcessMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "processes", metrics.getProcesses(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }
    
    @GetMapping("/networks")
    public Map<String, Object> getNetworkMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "networks", metrics.getNetworks(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }
    



    @GetMapping("/alerts")
    public Map<String, Object> getSystemAlerts() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        return Map.of(
            "alerts", metrics.getAlerts(),
            "timestamp", metrics.getSystemInfo().getTimestamp()
        );
    }   
}