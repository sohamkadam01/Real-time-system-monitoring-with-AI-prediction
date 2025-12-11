package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class NetworkDTO {
    private String name;
    private String displayName;
    private long bytesSent;
    private long bytesReceived;
    private long uploadSpeed;
    private long downloadSpeed;
}