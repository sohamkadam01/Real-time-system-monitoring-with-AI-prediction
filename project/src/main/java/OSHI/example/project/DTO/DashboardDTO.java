package OSHI.example.project.DTO;

import lombok.Data;
import java.util.List;

@Data
public class DashboardDTO {
    private double cpuUsage;
    private double memoryUsage;
    private Double cpuTemperature;
    private int runningProcesses;
    private String systemUptime;
    private String status;
    
    private Double fanSpeed; 
    private List<FanDTO> fans;
}