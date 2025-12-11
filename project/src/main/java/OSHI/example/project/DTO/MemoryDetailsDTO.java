package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class MemoryDetailsDTO {
    private long total;
    private long used;
    private long available;
    private double usagePercentage;
    private long swapTotal;
    private long swapUsed;
}