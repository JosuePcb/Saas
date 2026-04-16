package com.saas.modules.logistics.services;

import org.springframework.stereotype.Service;

@Service
public class LogisticsHealthService {

    public String status() {
        return "ok";
    }
}
