package com.yksoftware.assurance.service;

import com.yksoftware.assurance.dto.ClientRequest;
import com.yksoftware.assurance.exception.ResourceNotFoundException;
import com.yksoftware.assurance.model.Client;
import com.yksoftware.assurance.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Business logic for clients.
 * Equivalent of clientController.js.
 */
@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final FileStorageService fileStorageService;

    /** GET /api/clients?nom= */
    public List<Client> getAll(String nom) {
        if (nom != null && !nom.isBlank()) {
            // Try exact match first, fall back to partial
            List<Client> exact = clientRepository.findByNomRegexOrderByNomAsc(
                    "^" + nom.trim() + "$");
            if (!exact.isEmpty()) return exact;
            return clientRepository.searchByNom(nom.trim());
        }
        return clientRepository.findAllByOrderByNomAsc();
    }

    /** GET /api/clients/:id */
    public Client getById(String id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));
    }

    /** POST /api/clients (multipart) */
    public Client create(ClientRequest req, MultipartFile file) throws IOException {
        validateRequest(req, true);

        String docPath = null;
        if (file != null && !file.isEmpty()) {
            docPath = fileStorageService.store(file, "clients");
        }
        if (docPath == null) {
            throw new IllegalArgumentException("Document file is required");
        }

        Client client = Client.builder()
                .type(req.getType())
                .nom(req.getNom().trim())
                .tel(req.getTel().trim())
                .adresse(req.getAdresse().trim())
                .doc(docPath)
                .dateDebut(LocalDateTime.now())
                .budget(req.getBudget())
                .credit(req.getCredit())
                .build();

        applyTypeFields(client, req);
        return clientRepository.save(client);
    }

    /** PUT /api/clients/:id (multipart) */
    public Client update(String id, ClientRequest req, MultipartFile file) throws IOException {
        Client existing = getById(id);
        validateRequest(req, false);

        existing.setType(req.getType());
        existing.setNom(req.getNom().trim());
        existing.setTel(req.getTel().trim());
        existing.setAdresse(req.getAdresse().trim());
        existing.setBudget(req.getBudget());
        existing.setCredit(req.getCredit());

        if (file != null && !file.isEmpty()) {
            // Optionally delete old file
            fileStorageService.delete(existing.getDoc());
            existing.setDoc(fileStorageService.store(file, "clients"));
        }

        applyTypeFields(existing, req);
        return clientRepository.save(existing);
    }

    /** DELETE /api/clients/:id */
    public Client delete(String id) {
        Client client = getById(id);
        clientRepository.deleteById(id);
        return client;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private void validateRequest(ClientRequest req, boolean isCreate) {
        if (req.getNom() == null || req.getTel() == null || req.getAdresse() == null) {
            throw new IllegalArgumentException("Missing required fields: nom, tel, adresse, type");
        }
        if (req.getType() == Client.ClientType.particulier) {
            if (req.getCin() == null || req.getPrenom() == null) {
                throw new IllegalArgumentException("For particulier: cin and prenom are required");
            }
        }
        if (req.getType() == Client.ClientType.societe) {
            if (req.getIce() == null || req.getIdentifiantFiscal() == null || req.getRc() == null) {
                throw new IllegalArgumentException("For societe: ice, if, and rc are required");
            }
        }
    }

    private void applyTypeFields(Client client, ClientRequest req) {
        if (req.getType() == Client.ClientType.particulier) {
            client.setCin(req.getCin());
            client.setPrenom(req.getPrenom().trim());
            client.setIce(null);
            client.setIdentifiantFiscal(null);
            client.setRc(null);
        } else {
            client.setIce(req.getIce());
            client.setIdentifiantFiscal(req.getIdentifiantFiscal());
            client.setRc(req.getRc());
            client.setCin(null);
            client.setPrenom(null);
        }
    }
}
