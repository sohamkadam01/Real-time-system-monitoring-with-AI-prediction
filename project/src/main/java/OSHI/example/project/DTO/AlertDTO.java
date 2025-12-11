package OSHI.example.project.DTO;


import lombok.Data;

@Data
public class AlertDTO {
    private String type;
    private String level;
    private String message;
    private double value;
    private String threshold;
    private long timestamp;
}