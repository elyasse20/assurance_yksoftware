package com.yksoftware.assurance.dto;

import lombok.Data;
import java.util.List;

/** Request DTO for POST /api/productions and PUT /api/productions/:id */
@Data
public class ProductionRequest {
    private String natureOperation;
    private String client;
    private String dateEff;       // ISO date string: "2024-01-15"
    private String moisDem;
    private String compagne;
    private double tvaRate;
    private String category;
    private String numpolice;
    
    // Specific fields for MARITIME category (from Specifications)
    private String refCie;
    private String certificat;
    private String navire;

    private List<ProductionParameterRequest> parameters;

    @Data
    public static class ProductionParameterRequest {
        private String name;
        private double primes;
        private double taxe;
        private double taxepara;
        private double accessoire;
        private double cnpc;
    }
}
