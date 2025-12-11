package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class ProcessDTO {
    private int pid;
    private String name;
    private double cpuUsage;
    private long memoryUsage;
    private String state;
    private int threadCount;
}