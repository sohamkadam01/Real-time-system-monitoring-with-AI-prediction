package OSHI.example.project.DTO;

import lombok.Data;
import java.util.Date;

@Data
public class SystemInfoDTO {
    private Date timestamp;
    private String osName;
    private String osVersion;
    private String osManufacturer;
    private String systemManufacturer;
    private String systemModel;
}