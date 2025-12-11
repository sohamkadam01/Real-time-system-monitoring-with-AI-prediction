package OSHI.example.project.DTO;

import lombok.Data;
import java.util.Map;

@Data
public class CpuDetailsDTO {
    private String name;
    private int physicalCores;
    private int logicalCores;
    private String currentFrequency;
    private String maxFrequency;
    private double[] loadAverages = new double[3]; // Default empty array
    private double[] perCoreUsage = new double[0];
    private Map<String, Long> cpuTicks;
}