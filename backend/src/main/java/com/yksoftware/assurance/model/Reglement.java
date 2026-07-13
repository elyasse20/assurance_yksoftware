package com.yksoftware.assurance.model;

import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Maps to the 'regelements' collection.
 * Equivalent of RegelementModel.js.
 *
 * The Mongoose pre('save') hook for status auto-update is handled
 * in ReglementService.updateStatus() before every save.
 *
 * The virtual 'totalPaiements' is a @Transient computed method.
 */
@Document(collection = "regelements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reglement {

    @Id
    private String id;

    @DBRef
    private Production production;

    // Denormalized fields — mirrors production for easy display / export
    private String natureOperation;
    private String client;
    private LocalDate dateEff;
    private String moisDem;
    private String compagne;
    private String category;
    private String numpolice;

    @Builder.Default
    private double montantTotal = 0;

    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    @Builder.Default
    private ReglementStatus status = ReglementStatus.EN_ATTENTE;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Virtual — equivalent to reglementSchema.virtual('totalPaiements').
     * Not persisted to MongoDB.
     */
    @org.springframework.data.annotation.Transient
    public double getTotalPaiements() {
        if (payments == null || payments.isEmpty()) return 0;
        return payments.stream().mapToDouble(Payment::getMontant).sum();
    }

    public enum ReglementStatus {
        EN_ATTENTE, PARTIEL, PAYE
    }
}
