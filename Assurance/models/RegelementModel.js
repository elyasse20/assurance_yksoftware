import mongoose from 'mongoose';


/**
 * Paiement d'un règlement (règlement partiel possible)
 */
const paymentSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["CHEQUE", "ESPECE", "VIREMENT", "AUTRE"],
      required: true,
    },
    montant: {
      type: Number,
      required: true,
      default: 0,
    },

    // CHEQUE / EFFET
    dateEcheance: {
      type: Date,
    },
    banque: {
      type: String,
      trim: true,
    },
    numero: {
      type: String,
      trim: true,
    },
    emporteur: {
      type: String,
      trim: true,
    },

    // VIREMENT
    dateVirement: {
      type: Date,
    },

    // chemin fichier / URL (ila kat7et path dyal doc)
    doc: {
      type: String,
      trim: true,
    },

    commentaire: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Regelement lié à une production
 */
const reglementSchema = new mongoose.Schema(
  {
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
      required: true,
    },

    // duplications dyal infos (bch tkoun simple f affichage / export)
    natureOperation: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    dateEff: { type: Date, required: true },
    moisDem: { type: String, required: true }, // b7al production
    compagne: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    numpolice: { type: String, required: true, trim: true },

    // TTC total li ghadi tkhallas (sum dyal parameters, primes+taxes+...)
    montantTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    // liste des paiements (chèque, espèce, virement, ...)
    payments: {
      type: [paymentSchema],
      default: [],
    },

    // statut dial règlement
    status: {
      type: String,
      enum: ["EN_ATTENTE", "PARTIEL", "PAYE"],
      default: "EN_ATTENTE",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


reglementSchema.virtual("totalPaiements").get(function () {
  if (!this.payments || !this.payments.length) return 0;
  return this.payments.reduce((sum, p) => sum + (p.montant || 0), 0);
});

/**
 * قبل ما نسيفيو، نحدّث status automatiquement
 * EN_ATTENTE / PARTIEL / PAYE
 */
reglementSchema.pre("save", function (next) {
  const total = this.montantTotal || 0;
  const paid = this.totalPaiements;

  if (paid <= 0) {
    this.status = "EN_ATTENTE";
  } else if (paid < total) {
    this.status = "PARTIEL";
  } else {
    this.status = "PAYE";
  }

  next();
});

const Regelement = mongoose.model("Regelement", reglementSchema);

export default Regelement;

