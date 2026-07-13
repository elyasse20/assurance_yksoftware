package com.yksoftware.assurance.dto;

import com.yksoftware.assurance.model.Client.ClientType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for POST /api/clients and PUT /api/clients/:id.
 * Used for both multipart/form-data (the file is handled separately as MultipartFile).
 * Mirrors the body parsing in addClient / updateClient in clientController.js.
 */
@Data
public class ClientRequest {

    @NotNull
    private ClientType type;

    @NotBlank
    private String nom;

    private String prenom;      // required if type = particulier
    private String cin;         // required if type = particulier

    @NotBlank
    private String tel;

    @NotBlank
    private String adresse;

    private String ice;                 // required if type = societe
    private String identifiantFiscal;   // maps to 'if' in MongoDB
    private String rc;                  // required if type = societe

    private double budget;
    private double credit;
}
