package com.yksoftware.assurance.service;

import com.yksoftware.assurance.dto.ProductionRequest;
import com.yksoftware.assurance.exception.ResourceNotFoundException;
import com.yksoftware.assurance.model.Production;
import com.yksoftware.assurance.model.ProductionParameter;
import com.yksoftware.assurance.repository.ProductionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for productions (insurance policies).
 * Equivalent of productionController.js.
 */
@Service
@RequiredArgsConstructor
public class ProductionService {

    private final ProductionRepository productionRepository;

    public List<Production> getAll() {
        return productionRepository.findAll();
    }

    public Production getById(String id) {
        return productionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Production not found"));
    }

    public Production create(ProductionRequest req) {
        if (productionRepository.existsByNumpolice(req.getNumpolice())) {
            throw new IllegalArgumentException("numpolice already exists: " + req.getNumpolice());
        }
        Production prod = mapFromRequest(new Production(), req);
        return productionRepository.save(prod);
    }

    public Production update(String id, ProductionRequest req) {
        Production prod = getById(id);
        mapFromRequest(prod, req);
        return productionRepository.save(prod);
    }

    public void delete(String id) {
        if (!productionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Production not found");
        }
        productionRepository.deleteById(id);
    }

    private Production mapFromRequest(Production prod, ProductionRequest req) {
        prod.setNatureOperation(req.getNatureOperation());
        prod.setClient(req.getClient());
        prod.setDateEff(req.getDateEff() != null ? LocalDate.parse(req.getDateEff()) : null);
        prod.setMoisDem(req.getMoisDem());
        prod.setCompagne(req.getCompagne());
        prod.setTvaRate(req.getTvaRate());
        prod.setCategory(req.getCategory());
        prod.setNumpolice(req.getNumpolice());
        prod.setRefCie(req.getRefCie());
        prod.setCertificat(req.getCertificat());
        prod.setNavire(req.getNavire());

        if (req.getParameters() != null) {
            prod.setParameters(req.getParameters().stream()
                    .map(p -> ProductionParameter.builder()
                            .name(p.getName())
                            .primes(p.getPrimes())
                            .taxe(p.getTaxe())
                            .taxepara(p.getTaxepara())
                            .accessoire(p.getAccessoire())
                            .cnpc(p.getCnpc())
                            .build())
                    .collect(Collectors.toList()));
        }
        return prod;
    }
}
