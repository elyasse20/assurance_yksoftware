import Client from '../models/clientModel.js';

/**
 * Create a new client
 */
export const addClient = async (req, res) => {
  try {
    const { type, cin, nom, prenom, tel, adresse, ice, if: ifValue, rc, budget, credit } = req.body;
    const doc = req.file ? req.file.filename : null;

    if (!nom || !tel || !adresse || !type) {
      return res.status(400).json({ message: "Missing required fields: nom, tel, adresse, type" });
    }

    if (type === 'particulier' && (!cin || !prenom)) {
      return res.status(400).json({ message: "For particulier: cin and prenom are required" });
    }

    if (type === 'societe' && (!ice || !ifValue || !rc)) {
      return res.status(400).json({ message: "For societe: ice, if, and rc are required" });
    }

    const client = await Client.create({
      type,
      cin: type === 'particulier' ? cin : undefined,
      nom: nom.trim(),
      prenom: type === 'particulier' ? prenom.trim() : undefined,
      tel: tel.trim(),
      adresse: adresse.trim(),
      doc,
      ice: type === 'societe' ? ice : undefined,
      if: type === 'societe' ? ifValue : undefined,
      rc: type === 'societe' ? rc : undefined,
      date_debut: new Date(),
      budget: Number(budget) || 0,
      credit: Number(credit) || 0,
    });

    console.log(`✓ Client créé: ${client.nom} (Crédit: ${client.credit} DH)`);
    res.status(201).json(client);
  } catch (err) {
    console.error('Error adding client:', err);
    res.status(400).json({ message: err.message });
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, cin, nom, prenom, tel, adresse, ice, if: ifValue, rc, budget, credit } = req.body;

    if (!nom || !tel || !adresse) {
      return res.status(400).json({ message: "Missing required fields: nom, tel, adresse" });
    }

    const updatedData = {
      type,
      nom: nom.trim(),
      tel: tel.trim(),
      adresse: adresse.trim(),
      budget: Number(budget) || 0,
      credit: Number(credit) || 0,
    };

    if (type === 'particulier') {
      if (!prenom || !cin) {
        return res.status(400).json({ message: "For particulier: cin and prenom are required" });
      }
      updatedData.cin = cin;
      updatedData.prenom = prenom.trim();
      updatedData.ice = undefined;
      updatedData.if = undefined;
      updatedData.rc = undefined;
    } else if (type === 'societe') {
      if (!ice || !ifValue || !rc) {
        return res.status(400).json({ message: "For societe: ice, if, and rc are required" });
      }
      updatedData.ice = ice;
      updatedData.if = ifValue;
      updatedData.rc = rc;
      updatedData.cin = undefined;
      updatedData.prenom = undefined;
    }

    if (req.file) {
      updatedData.doc = req.file.filename;
    }

    const client = await Client.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    console.log(`✓ Client modifié: ${client.nom} (Crédit: ${client.credit} DH)`);
    res.status(200).json(client);
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(400).json({ message: err.message });
  }
};

/**
 * Get all clients or search by name
 */
export const getClients = async (req, res) => {
  try {
    const { nom } = req.query;

    if (nom) {
      let clients = await Client.find({
        nom: { $regex: `^${nom.trim()}$`, $options: 'i' }
      }).sort({ nom: 1 });

      if (clients.length === 0) {
        clients = await Client.find({
          nom: { $regex: nom.trim(), $options: 'i' }
        }).sort({ nom: 1 });
      }

      return res.json(clients);
    }

    const clients = await Client.find().sort({ nom: 1 });
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get a single client by ID
 */
export const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    console.log(`✓ Client supprimé: ${client.nom}`);
    res.json({ message: "Client deleted successfully", deletedClient: client });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ message: err.message });
  }
};
