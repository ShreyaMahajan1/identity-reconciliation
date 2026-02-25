import express from 'express';
import { database } from './database';
import { identifyContact } from './service';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Identity Reconciliation Service',
    endpoint: 'POST /identify',
    usage: 'Send POST request with JSON body containing email and/or phoneNumber'
  });
});

app.post('/identify', async (req, res) => {
  try {
    const result = await identifyContact(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

async function start() {
  await database.initialize();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
