package OSHI.example.project.WebSocketConfiguration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import OSHI.example.project.DTO.SystemMetricsDTO;
import OSHI.example.project.Service.SystemMonitoringService;

@Controller
@EnableScheduling
public class WebSocketController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private SystemMonitoringService monitoringService;
    
    @Scheduled(fixedRate = 3000) // Update every 3 seconds
    public void sendSystemMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        messagingTemplate.convertAndSend("/topic/metrics", metrics);
    }
    
    @MessageMapping("/request-metrics")
    public void requestMetrics() {
        SystemMetricsDTO metrics = monitoringService.getSystemMetrics();
        messagingTemplate.convertAndSend("/topic/metrics", metrics);
    }
}