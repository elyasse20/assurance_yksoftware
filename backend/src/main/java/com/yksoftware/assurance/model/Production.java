package com.yksoftware.assurance.model;

import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Maps to the 'productions' collection.
 * Equivalent of productionModel.js.
 *
 * The 'montantTotal' virtual is implemented as a @Transient computed method.
 */
@Document(collection = "productions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Production {

    @Id
    private String id;

    private String natureOperation;

    @Indexed
    private String client;

    private LocalDate dateEff;
    private String moisDem;
    private String compagne;

    @Builder.Default
    private double tvaRate = 0;

    private String category;

    @Indexed
    @Field("numpolice")
    private String numpolice;

    @Builder.Default
    private List<ProductionParameter> parameters = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Virtual total — equivalent to productionSchema.virtual('montantTotal').
     * Not persisted to MongoDB.
     */
    @org.springframework.data.annotation.Transient
    public double getMontantTotal() {
        if (parameters == null || parameters.isEmpty()) return 0;
        return parameters.stream().mapToDouble(p ->
            p.getPrimes() + p.getTaxe() + p.getTaxepara() + p.getAccessoire() + p.getCnpc()
        ).sum();
    }
}
