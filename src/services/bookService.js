const pool = require("../db");

async function getAll(req, res) {
  const result = await pool.query("SELECT * FROM book ORDER BY title");
  res.json(result.rows);
}

async function getById(req, res) {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM book WHERE id = $1", [id]);
  const book = result.rows[0];
  if (!book) return res.status(404).json({ message: "Book non trouvé" });
  res.json(book);
}

async function create(req, res) {
  const { title, author, publish_date, isbn, price, quantity } = req.body;
  if (!title || !author) {
    return res.status(400).json({ message: "title et author sont requis" });
  }
  const result = await pool.query(
    `INSERT INTO book (title, author, publish_date, isbn, price, quantity)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, author, publish_date, isbn, price, quantity]
  );
  res.status(201).json(result.rows[0]);
}

async function update(req, res) {
  const { id } = req.params;
  const { title, author, publish_date, isbn, price, quantity } = req.body;
  const result = await pool.query(
    `UPDATE book SET title = $1, author = $2, publish_date = $3,
     isbn = $4, price = $5, quantity = $6 WHERE id = $7 RETURNING *`,
    [title, author, publish_date, isbn, price, quantity, id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Book non trouvé" });
  }
  res.json(result.rows[0]);
}

async function remove(req, res) {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM book WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Book non trouvé" });
  }
  res.status(204).send();
}
async function averagePriceByAuthor(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        author AS _id,
        COUNT(*) AS "totalBooks",
        ROUND(AVG(price)::numeric, 4) AS "averagePrice"
      FROM book
      GROUP BY author
      ORDER BY author
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur calcul moyenne prix par auteur :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
async function bestReviews(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        b.id AS "bookId",
        b.title,
        ROUND(AVG(r.rating)::numeric, 2) AS "avgRating",
        COUNT(r.id) AS "reviewCount"
      FROM book b
      JOIN book_review r ON b.id = r.book_id
      GROUP BY b.id, b.title
      HAVING COUNT(r.id) > 0
      ORDER BY "avgRating" DESC, "reviewCount" DESC
    `);

    const formatted = result.rows.map(row => ({
      _id: {
        bookId: row.bookId,
        title: row.title
      },
      avgRating: parseFloat(row.avgRating),
      reviewCount: parseInt(row.reviewCount, 10)
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Erreur best-reviews:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}


module.exports = { getAll, getById, create, update, remove, averagePriceByAuthor, bestReviews };
