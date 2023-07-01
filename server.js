const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const fs = require('fs');
const stripe = require('stripe');

dotenv.config(); // Load environment variables from .env file

const { STRIPE_SECRET_KEY, STRIPE_PUBLIC_KEY } = process.env;

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  fs.readFile('items.json', (error, data) => {
    if (error) {
      res.status(500).end();
    } else {
      res.render('store.ejs', {
        stripePublicKey: STRIPE_PUBLIC_KEY,
        items: JSON.parse(data),
      });
    }
  });
});

app.post('/purchase', (req, res) => {
  fs.readFile('items.json', (error, data) => {
    if (error) {
      res.status(500).end();
    } else {
      const itemsJson = JSON.parse(data);
      const itemsArray = itemsJson.music.concat(itemsJson.merch);
      let total = 0;
      req.body.items.forEach((item) => {
        const itemJson = itemsArray.find((i) => i.id === item.id);
        total += itemJson.price * item.quantity;
      });

      stripe(STRIPE_SECRET_KEY)
        .charges.create({
          amount: total,
          source: req.body.stripeTokenId,
          currency: 'sgd',
        })
        .then(() => {
          console.log('Charge Successful');
          res.json({ success: true, message: 'Successfully Purchased Items' });
        })
        .catch(() => {
          console.log('Charge Failed');
          res.json({ success: false, message: 'Failed to Purchase Items' });
        });        
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});