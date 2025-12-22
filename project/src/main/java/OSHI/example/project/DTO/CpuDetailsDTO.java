package OSHI.example.project.DTO;

import java.util.List;
import java.util.Map;

public class CpuDetailsDTO {
    private String name;
    private int physicalCores;
    private int logicalCores;
    private String currentFrequency;
    private Long currentFrequencyRaw;  // <-- ADD THIS FIELD
    private String maxFrequency;
    private Long maxFrequencyRaw;
    private List<Long> currentFrequencies;
    private double[] loadAverages;
    private double[] perCoreUsage;
    private Map<String, Long> cpuTicks;
    
    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public int getPhysicalCores() { return physicalCores; }
    public void setPhysicalCores(int physicalCores) { this.physicalCores = physicalCores; }
    
    public int getLogicalCores() { return logicalCores; }
    public void setLogicalCores(int logicalCores) { this.logicalCores = logicalCores; }
    
    public String getCurrentFrequency() { return currentFrequency; }
    public void setCurrentFrequency(String currentFrequency) { this.currentFrequency = currentFrequency; }
    
    // ADD THESE GETTER AND SETTER
    public Long getCurrentFrequencyRaw() { return currentFrequencyRaw; }
    public void setCurrentFrequencyRaw(Long currentFrequencyRaw) { this.currentFrequencyRaw = currentFrequencyRaw; }
    
    public String getMaxFrequency() { return maxFrequency; }
    public void setMaxFrequency(String maxFrequency) { this.maxFrequency = maxFrequency; }
    
    public Long getMaxFrequencyRaw() { return maxFrequencyRaw; }
    public void setMaxFrequencyRaw(Long maxFrequencyRaw) { this.maxFrequencyRaw = maxFrequencyRaw; }
    
    public List<Long> getCurrentFrequencies() { return currentFrequencies; }
    public void setCurrentFrequencies(List<Long> currentFrequencies) { this.currentFrequencies = currentFrequencies; }
    
    public double[] getLoadAverages() { return loadAverages; }
    public void setLoadAverages(double[] loadAverages) { this.loadAverages = loadAverages; }
    
    public double[] getPerCoreUsage() { return perCoreUsage; }
    public void setPerCoreUsage(double[] perCoreUsage) { this.perCoreUsage = perCoreUsage; }
    
    public Map<String, Long> getCpuTicks() { return cpuTicks; }
    public void setCpuTicks(Map<String, Long> cpuTicks) { this.cpuTicks = cpuTicks; }
}