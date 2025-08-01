const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'pg-service',
  database: 'postgres',
  password: 'password',
  port: 5432,
});

// GET /api/parts — fetch from PostgreSQL
app.get('/api/parts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parts');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching parts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/cart/add', async (req, res) => {
  const { userId, partId, quantity } = req.body;

  if (!userId || !partId || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await pool.query(
      `INSERT INTO cart_items (user_id, part_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, part_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [userId, partId, quantity]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});


// Checkout with actual total
app.post('/api/cart/checkout', async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await pool.query(
      `SELECT SUM(p.price * c.quantity) AS total
       FROM cart_items c
       JOIN parts p ON c.part_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );

    const total = result.rows[0].total || 0;

    // clear the cart after checkout
    await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

    res.json({ total });
  } catch (err) {
    console.error('Error during checkout:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Start server
app.listen(3001, () => {
  console.log('✅ Backend running on http://localhost:3001');
});
