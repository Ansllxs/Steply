const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/salud', (req, res) => {
  res.json({ ok: true, mensaje: 'Steply backend funcionando' });
});

module.exports = app;