package com.yksoftware.assurance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Generic request DTO for simple lookup items: Nature, Category, Parametre, Tva */
@Data
public class SimpleItemRequest {
    @NotBlank
    private String name;
    private Double rate;  // used only for TVA
}
