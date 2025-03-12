const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3006;

app.use(express.json());



// Middleware bắt dữ liệu POST
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('Received POST data:', req.body);
    }
    next();
});

// Route mặc định
app.get('/', (req, res) => {
    res.send('Hello, this is a Node.js server!');
});




// Bắt đầu lắng nghe trên cổng PORT
app.listen(PORT, () => {
    console.log(`Server đang lắng nghe trên http://localhost:${PORT}`);
});

