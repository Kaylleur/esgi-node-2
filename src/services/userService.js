const pool = require("../db");
const bcrypt = require("bcrypt");

async function createUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email et password sont requis" });
  }

  try {
    // Vérifie si l'utilisateur existe déjà
    const existing = await pool.query('SELECT 1 FROM "user" WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "user" (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur création utilisateur:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

module.exports = { createUser };
