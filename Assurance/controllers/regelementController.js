// controllers/regelementController.js
import Regelement from '../models/RegelementModel.js';
import Production from '../models/productionModel.js';
import Client from '../models/clientModel.js';

/**
 * Parse payments from multipart form data
 */
function parsePaymentsFromRequest(req) {
  if (Array.isArray(req.body.payments)) {
    const payments = req.body.payments.map(p => ({
      ...p,
      montant: parseFloat(p.montant) || 0,
      dateEcheance: p.dateEcheance ? new Date(p.dateEcheance) : null,
      dateVirement: p.dateVirement ? new Date(p.dateVirement) : null,
    }));
    return payments;
  }

  // Fallback: bracket notation (legacy support)
  const paymentsMap = {};

  for (const [key, value] of Object.entries(req.body)) {
    const match = key.match(/^payments\[(\d+)\]\[(\w+)\]$/);
    if (!match) continue;

    const index = match[1];
    const field = match[2];

    if (!paymentsMap[index]) paymentsMap[index] = {};

    if (field === "montant") {
      paymentsMap[index][field] = parseFloat(value) || 0;
    } else if (["dateEcheance", "dateVirement"].includes(field)) {
      paymentsMap[index][field] = value ? new Date(value) : null;
    } else {
      paymentsMap[index][field] = value;
    }
  }

  return Object.keys(paymentsMap)
    .sort((a, b) => Number(a) - Number(b))
    .map((i) => paymentsMap[i]);
}

export const getAllRegles = async (req, res) => {
  try {
    const regles = await Regelement.find();
    res.json(regles);
  } catch (err) {
    console.error("Error fetching regles:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des règles" });
  }
};

/**
 * Get all regelements, optionally filtered by client
 */
export const getAllReglements = async (req, res) => {
  try {
    const { client } = req.query;

    let query = {};
    if (client) {
      query.client = { $regex: `^${client.trim()}$`, $options: 'i' };
    }

    const reglements = await Regelement.find(query);
    res.json(reglements);
  } catch (err) {
    console.error("Error fetching reglements:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des règlements" });
  }
};

/**
 * Get regelement for a production
 */
export const getRegelementByProduction = async (req, res) => {
  try {
    const { productionId } = req.params;

    const reglement = await Regelement.findOne({
      production: productionId,
    }).populate("production");

    if (!reglement) {
      return res.status(404).json({ message: "Règlement introuvable" });
    }

    res.json(reglement);
  } catch (err) {
    console.error("Error fetching reglement:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du règlement" });
  }
};

/**
 * Create or update regelement with payment
 */
export const createOrUpdateRegelementPaiement = async (req, res) => {
  try {
    const { productionId } = req.params;

    // 1) VERIFY PRODUCTION EXISTS
    const production = await Production.findById(productionId);
    if (!production) {
      return res.status(404).json({ message: "Production (opération) introuvable" });
    }

    // 2) PARSE FIELDS
    const {
      client,
      natureOperation,
      dateEff,
      moisDem,
      compagne,
      category,
      numpolice,
      montantTotal,
    } = req.body;

    // 3) PARSE PAYMENTS
    const payments = parsePaymentsFromRequest(req);

    // 4) VALIDATE PAYMENTS
    const totalNewPayments = payments.reduce((sum, p) => sum + (p.montant || 0), 0);

    if (totalNewPayments <= 0) {
      return res.status(400).json({
        message: "Au moins un montant de paiement est requis",
        debug: {
          payments: payments.map(p => ({ montant: p.montant, mode: p.mode })),
          totalNewPayments,
        }
      });
    }

    // 5) GET EXISTING REGLEMENT TO TRACK PAYMENT CHANGES
    const existingReglement = await Regelement.findOne({ production: productionId });

    const oldTotalPaid = existingReglement
      ? existingReglement.payments.reduce((sum, p) => sum + (p.montant || 0), 0)
      : 0;

    const newPaymentAmount = Math.max(totalNewPayments - oldTotalPaid, 0);

    // 6) SAVE / UPDATE REGLEMENT
    const allPayments = existingReglement
      ? [...(existingReglement.payments || []), ...payments]
      : payments;

    const reglement = await Regelement.findOneAndUpdate(
      { production: productionId },
      {
        production: productionId,
        natureOperation: natureOperation || production.natureOperation,
        client: client || production.client,
        dateEff: dateEff ? new Date(dateEff) : production.dateEff,
        moisDem: moisDem || production.moisDem,
        compagne: compagne || production.compagne,
        category: category || production.category,
        numpolice: numpolice || production.numpolice,
        montantTotal: Number(montantTotal) || 0,
        payments: allPayments,
      },
      { new: true, upsert: true, runValidators: true }
    );

    await reglement.save();

    // 7) UPDATE CLIENT CREDIT (ONLY FOR NEW PAYMENTS)
    if (newPaymentAmount > 0 && client) {
      try {
        const clientDb = await Client.findOne({
          nom: { $regex: `^${client.trim()}$`, $options: 'i' }
        });

        if (clientDb) {
          const previousCredit = clientDb.credit;
          clientDb.credit = Math.max(0, Number(clientDb.credit || 0) - newPaymentAmount);
          await clientDb.save();
          console.log(`✔ Crédit mis à jour: "${clientDb.nom}" | Avant: ${previousCredit} DH | Après: ${clientDb.credit} DH`);
        } else {
          console.warn(`⚠ Client "${client}" non trouvé - crédit non mis à jour`);
        }
      } catch (creditErr) {
        console.error("Error updating client credit:", creditErr);
      }
    }

    res.json(reglement);
  } catch (err) {
    console.error("Error saving reglement/paiement:", err);
    res.status(500).json({
      message: "Erreur serveur lors de l'enregistrement du règlement / paiement",
      error: err.message
    });
  }
};
