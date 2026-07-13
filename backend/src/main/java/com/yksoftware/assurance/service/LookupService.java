package com.yksoftware.assurance.service;

import com.yksoftware.assurance.dto.SimpleItemRequest;
import com.yksoftware.assurance.exception.ResourceNotFoundException;
import com.yksoftware.assurance.model.*;
import com.yksoftware.assurance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

/** Handles CRUD for simple lookup entities: Nature, Category, Parametre, Tva. */
@Service
@RequiredArgsConstructor
public class LookupService {

    private final NatureRepository natureRepository;
    private final CategoryRepository categoryRepository;
    private final ParametreRepository parametreRepository;
    private final TvaRepository tvaRepository;

    // ─── Nature ──────────────────────────────────────────────────────────────────
    public List<Nature> getAllNatures() { return natureRepository.findAll(); }
    public Nature createNature(SimpleItemRequest req) {
        return natureRepository.save(Nature.builder().name(req.getName()).build());
    }
    public Nature updateNature(String id, SimpleItemRequest req) {
        Nature n = natureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nature not found"));
        n.setName(req.getName());
        return natureRepository.save(n);
    }
    public void deleteNature(String id) {
        if (!natureRepository.existsById(id)) throw new ResourceNotFoundException("Nature not found");
        natureRepository.deleteById(id);
    }

    // ─── Category ────────────────────────────────────────────────────────────────
    public List<Category> getAllCategories() { return categoryRepository.findAll(); }
    public Category createCategory(SimpleItemRequest req) {
        return categoryRepository.save(Category.builder()
                .name(req.getName())
                .commissionRate(req.getCommissionRate() != null ? req.getCommissionRate() : 0.0)
                .build());
    }
    public Category updateCategory(String id, SimpleItemRequest req) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        c.setName(req.getName());
        if (req.getCommissionRate() != null) {
            c.setCommissionRate(req.getCommissionRate());
        }
        return categoryRepository.save(c);
    }
    public void deleteCategory(String id) {
        if (!categoryRepository.existsById(id)) throw new ResourceNotFoundException("Category not found");
        categoryRepository.deleteById(id);
    }

    // ─── Parametre ───────────────────────────────────────────────────────────────
    public List<Parametre> getAllParametres() { return parametreRepository.findAll(); }
    public Parametre createParametre(SimpleItemRequest req) {
        return parametreRepository.save(Parametre.builder()
                .name(req.getName())
                .value(req.getValue())
                .type(req.getType() != null ? req.getType() : "text")
                .build());
    }
    public Parametre updateParametre(String id, SimpleItemRequest req) {
        Parametre p = parametreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parametre not found"));
        p.setName(req.getName());
        p.setValue(req.getValue());
        if (req.getType() != null) {
            p.setType(req.getType());
        }
        return parametreRepository.save(p);
    }
    public void deleteParametre(String id) {
        if (!parametreRepository.existsById(id)) throw new ResourceNotFoundException("Parametre not found");
        parametreRepository.deleteById(id);
    }

    // ─── TVA ─────────────────────────────────────────────────────────────────────
    public List<Tva> getAllTvas() { return tvaRepository.findAll(); }
    public Tva createTva(SimpleItemRequest req) {
        return tvaRepository.save(Tva.builder()
                .name(req.getName())
                .rate(req.getRate() != null ? req.getRate() : 0)
                .build());
    }
    public Tva updateTva(String id, SimpleItemRequest req) {
        Tva t = tvaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TVA not found"));
        t.setName(req.getName());
        if (req.getRate() != null) t.setRate(req.getRate());
        return tvaRepository.save(t);
    }
    public void deleteTva(String id) {
        if (!tvaRepository.existsById(id)) throw new ResourceNotFoundException("TVA not found");
        tvaRepository.deleteById(id);
    }
}
