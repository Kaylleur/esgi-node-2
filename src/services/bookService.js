const pool = require("../db");

async function getAll(req, res) {
  let query = 'SELECT * FROM book';
  const params = [];
  if(req.query.title) {
    query += ' WHERE title ILIKE $1';
    params.push(`%${req.query.title}%`);
  }
  if(req.query.sort){
    const direction = req.query.sort[0] === '-' ? 'DESC' : 'ASC'; // ASC or DESC
    const column = req.query.sort[0] === '-' ? req.query.sort.slice(1) : req.query.sort;
    query += ` ORDER BY ${column} ${direction}`;
  }else{
    query += ' ORDER BY title ASC';
  }
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const skip = req.query.skip ? parseInt(req.query.skip) : 0;
  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(limit, skip);

  const result = await pool.query(query, params);

  res.json(result.rows);
}

async function getById(req, res) {
  const { id } = req.params; // req.params.id
  const result = await pool.query("SELECT * FROM book WHERE id = $1", [id]);
  const book = result.rows[0];
  if (!book) return res.status(404).json({ message: "Book non trouvé" });

  res.json({
    id: book.id,
    title: book.title,
    author: book.author,
    publishDate: book.publish_date,
    isbn: book.isbn,
    price: book.price,
    quantity: book.quantity,
    reviews: []
  });
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
        author AS id,
        COUNT(*) AS "totalBooks",
        ROUND(AVG(price)::numeric, 4) AS "averagePrice"
      FROM book
      GROUP BY author
      ORDER BY "averagePrice" DESC
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
      id: {
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
