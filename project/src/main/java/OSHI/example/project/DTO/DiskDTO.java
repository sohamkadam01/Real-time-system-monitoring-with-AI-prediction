package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class DiskDTO {
    private String name;
    private String mountPoint;
    private String type;
    private long totalSpace;
    private long freeSpace;
    private long usedSpace;
    private double usagePercentage;
    private String status;
}