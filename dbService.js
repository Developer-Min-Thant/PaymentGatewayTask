const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI; // Your MongoDB URI
const client = new MongoClient(uri);

async function connect() {
    try {
        await client.connect();
        console.log('Connected to database');
    } catch (error) {
        console.error('Could not connect to database:', error);
    }
}

module.exports = { client, connect };
