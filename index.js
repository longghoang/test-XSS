const express = require('express');
const app = express();
const PORT = 3006;

app.use(express.json());

app.use((req, res, next) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('Received POST data:', body);
        });
    }
    next();
});

// Bắt đầu lắng nghe trên cổng PORT
app.listen(PORT, () => {
    console.log(`Server đang lắng nghe trên http://localhost:${PORT}`);
});
