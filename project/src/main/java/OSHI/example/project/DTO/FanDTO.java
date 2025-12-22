
package OSHI.example.project.DTO;

public class FanDTO {
    private String name;
    private int fanNumber;
    private Integer speed; // RPM, null if unavailable
    private String status;
    
    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public int getFanNumber() { return fanNumber; }
    public void setFanNumber(int fanNumber) { this.fanNumber = fanNumber; }
    
    public Integer getSpeed() { return speed; }
    public void setSpeed(Integer speed) { this.speed = speed; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}