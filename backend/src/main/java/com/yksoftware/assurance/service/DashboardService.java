package com.yksoftware.assurance.service;

import com.yksoftware.assurance.dto.DashboardStats;
import com.yksoftware.assurance.model.Payment;
import com.yksoftware.assurance.model.Production;
import com.yksoftware.assurance.model.Reglement;
import com.yksoftware.assurance.repository.ClientRepository;
import com.yksoftware.assurance.repository.ProductionRepository;
import com.yksoftware.assurance.repository.ReglementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes all dashboard aggregations in-memory from MongoDB collections.
 * This avoids complex MongoDB aggregation pipelines while keeping the
 * frontend to a single HTTP call.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductionRepository productionRepository;
    private final ReglementRepository reglementRepository;
    private final ClientRepository clientRepository;

    public DashboardStats getStats() {
        List<Production> productions = productionRepository.findAll();
        List<Reglement> regelements = reglementRepository.findAll();
        long totalClients = clientRepository.count();

        // ── Montants ──────────────────────────────────────────────────────────
        double montantTotal = productions.stream()
                .mapToDouble(Production::getMontantTotal)
                .sum();

        double montantRegle = regelements.stream()
                .flatMap(r -> {
                    List<Payment> pmts = r.getPayments();
                    return (pmts != null ? pmts : Collections.<Payment>emptyList()).stream();
                })
                .mapToDouble(Payment::getMontant)
                .sum();


        double montantRestant = Math.max(0, montantTotal - montantRegle);

        // ── Reglement status counts ────────────────────────────────────────────
        long paie     = regelements.stream().filter(r -> r.getStatus() == Reglement.ReglementStatus.PAYE).count();
        long partiel  = regelements.stream().filter(r -> r.getStatus() == Reglement.ReglementStatus.PARTIEL).count();
        long attente  = regelements.stream().filter(r -> r.getStatus() == Reglement.ReglementStatus.EN_ATTENTE).count();

        // ── By Category ───────────────────────────────────────────────────────
        Map<String, List<Production>> byCategory = productions.stream()
                .collect(Collectors.groupingBy(p -> p.getCategory() != null ? p.getCategory() : "Autre"));

        List<DashboardStats.CategoryStat> categoryStats = byCategory.entrySet().stream()
                .map(e -> DashboardStats.CategoryStat.builder()
                        .category(e.getKey())
                        .count(e.getValue().size())
                        .montant(e.getValue().stream().mapToDouble(Production::getMontantTotal).sum())
                        .build())
                .sorted(Comparator.comparingDouble(DashboardStats.CategoryStat::getMontant).reversed())
                .collect(Collectors.toList());

        // ── By Compagne ───────────────────────────────────────────────────────
        Map<String, Long> byCompagne = productions.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCompagne() != null ? p.getCompagne() : "Autre",
                        Collectors.counting()
                ));

        List<DashboardStats.LabelValue> compagneStats = byCompagne.entrySet().stream()
                .map(e -> DashboardStats.LabelValue.builder()
                        .label(e.getKey())
                        .value(e.getValue())
                        .build())
                .sorted(Comparator.comparingDouble(DashboardStats.LabelValue::getValue).reversed())
                .limit(8)
                .collect(Collectors.toList());

        // ── By Month (last 12 months) ─────────────────────────────────────────
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Long> byMonth = productions.stream()
                .filter(p -> p.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate().format(monthFmt),
                        Collectors.counting()
                ));

        // Ensure last 12 months are all present (fill zeros)
        java.time.LocalDate now = java.time.LocalDate.now();
        List<DashboardStats.LabelValue> monthStats = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            java.time.LocalDate m = now.minusMonths(i).withDayOfMonth(1);
            String key = m.format(monthFmt);
            monthStats.add(DashboardStats.LabelValue.builder()
                    .label(key)
                    .value(byMonth.getOrDefault(key, 0L))
                    .build());
        }

        // ── Recent productions (last 5) ───────────────────────────────────────
        // Build a map productionId → reglementStatus for quick lookup
        Map<String, String> reglementStatusByProdId = regelements.stream()
                .filter(r -> r.getProduction() != null)
                .collect(Collectors.toMap(
                        r -> r.getProduction().getId(),
                        r -> r.getStatus().name(),
                        (a, b) -> a // keep first in case of duplicate
                ));

        List<DashboardStats.RecentProduction> recentProductions = productions.stream()
                .filter(p -> p.getCreatedAt() != null)
                .sorted(Comparator.comparing(Production::getCreatedAt).reversed())
                .limit(5)
                .map(p -> DashboardStats.RecentProduction.builder()
                        .id(p.getId())
                        .numpolice(p.getNumpolice())
                        .client(p.getClient())
                        .category(p.getCategory())
                        .compagne(p.getCompagne())
                        .montant(p.getMontantTotal())
                        .dateEff(p.getDateEff() != null ? p.getDateEff().toString() : null)
                        .reglementStatus(reglementStatusByProdId.get(p.getId()))
                        .build())
                .collect(Collectors.toList());

        return DashboardStats.builder()
                .totalProductions(productions.size())
                .montantTotal(montantTotal)
                .montantRegle(montantRegle)
                .montantRestant(montantRestant)
                .totalClients(totalClients)
                .reglementsPaie(paie)
                .reglementsPartiel(partiel)
                .reglementsEnAttente(attente)
                .byCategory(categoryStats)
                .byCompagne(compagneStats)
                .byMonth(monthStats)
                .recentProductions(recentProductions)
                .build();
    }
}
