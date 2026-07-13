package com.yksoftware.assurance.dto;

import lombok.Data;
import java.util.List;

/**
 * Request DTO for POST /api/regelements/:productionId/paiement.
 * Mirrors createOrUpdateRegelementPaiement in regelementController.js.
 */
@Data
public class ReglementRequest {
    private String client;
    private String natureOperation;
    private String dateEff;
    private String moisDem;
    private String compagne;
    private String category;
    private String numpolice;
    private double montantTotal;
    private List<PaymentRequest> payments;
}
