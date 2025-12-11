package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class DashboardDTO {
    private double cpuUsage;
    private double memoryUsage;
    private double cpuTemperature;
    private int runningProcesses;
    private String systemUptime;
    private String status;
}