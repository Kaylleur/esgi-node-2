const { Client } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Config connexion PostgreSQL
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'myuser',
  password: 'mypassword',
  database: 'mydb',
});

async function main() {
  try {
    await client.connect();

    // 1. Hash du mot de passe admin
    const email = 'admin@localhost';
    const plainPassword = 'admin';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Vérifie si l'admin existe déjà
    const res = await client.query('SELECT 1 FROM "user" WHERE email = $1', [email]);
    if (res.rowCount === 0) {
      await client.query('INSERT INTO "user" (email, password) VALUES ($1, $2)', [
        email,
        hashedPassword,
      ]);
      console.log('✅ Utilisateur admin inséré.');
    } else {
      console.log('ℹ️ Utilisateur admin déjà existant.');
    }

    // 2. Lecture du fichier books.json
    const booksRaw = fs.readFileSync('./books.json', 'utf8');
    const books = JSON.parse(booksRaw);

    for (const book of books) {
      await client.query(
        `INSERT INTO book (title, author, publish_date, isbn, price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (isbn) DO NOTHING`,
        [
          book.title,
          book.author,
          book.publishDate || null,
          book.isbn || null,
          book.price || 0,
          book.quantity || 0,
        ]
      );
    }

    console.log('📚 Livres insérés avec succès.');
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await client.end();
  }

}
const { randomUUID } = require("crypto");
const pool = require("./src/db");

const categories = ["Science Fiction", "Philosophy", "Programming", "Fantasy"];

async function migrate() {
  try {
    await pool.connect();

    console.log("1️⃣ Insertion des catégories...");
    const categoryIds = [];
    for (const name of categories) {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO category (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, name]
      );
      categoryIds.push(id);
    }

    console.log("2️⃣ Attribution des catégories aux livres...");
    const books = await pool.query("SELECT id FROM book");
    for (const book of books.rows) {
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      await pool.query(
        `UPDATE book SET category_id = $1 WHERE id = $2`,
        [categoryId, book.id]
      );
    }

    console.log("3️⃣ Génération de reviews...");
    for (const book of books.rows) {
      const numberOfReviews = Math.floor(Math.random() * 5) + 1; // entre 1 et 5

      for (let i = 0; i < numberOfReviews; i++) {
        const rating = Math.floor(Math.random() * 5) + 1;
        const user = `user${Math.floor(Math.random() * 1000)}`;
        await pool.query(
          `INSERT INTO book_review (id, book_id, user_name, message, rating)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), book.id, user, "lorem ipsum", rating]
        );
      }
    }

    console.log("✅ Migration terminée avec succès !");
    console.log("✅ Base de données initialisée avec succès !")
    return process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de la migration :", err);
  } finally {
    await pool.end();
  }
}


main()
  .then(() => migrate())
