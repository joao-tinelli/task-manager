package com.example.taskmanager.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:5173}}")
public class InfoController {

    /**
     * Retorna informações da instância que atendeu a requisição.
     * Em Kubernetes, o hostname do container é definido automaticamente
     * pelo kubelet como o nome do Pod — sem necessidade de configuração manual.
     *
     * @return mapa com application, hostname, ip e timestamp
     */
    @GetMapping("/info")
    public Map<String, Object> getInfo() {
        String hostname = "unknown";
        String ipAddress = "unknown";

        try {
            // InetAddress.getLocalHost() resolve o hostname do SO do container.
            // No Kubernetes, o kubelet define o hostname do Pod como nome do container,
            // portanto este valor corresponde diretamente ao nome do Pod.
            InetAddress localHost = InetAddress.getLocalHost();
            hostname = localHost.getHostName();
            ipAddress = localHost.getHostAddress();
        } catch (UnknownHostException e) {
            // Fallback para a variável de ambiente HOSTNAME (definida automaticamente
            // pelo Linux/Kubernetes — nunca configurada manualmente).
            String envHostname = System.getenv("HOSTNAME");
            if (envHostname != null && !envHostname.isBlank()) {
                hostname = envHostname;
            }
        }

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("application", "task-manager");
        info.put("hostname", hostname);
        info.put("ip", ipAddress);
        info.put("timestamp", Instant.now().toString());

        return info;
    }
}

