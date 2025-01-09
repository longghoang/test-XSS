const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3006;

// Middleware để parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Route hiển thị form đăng nhập
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authentication</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #1e1e1e;
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #2b2b2b;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
          text-align: left;
        }
        label {
          display: block;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        input {
          width: 100%;
          padding: 0.8rem;
          font-size: 1rem;
          border: 1px solid #444;
          border-radius: 4px;
          background-color: #333;
          color: #fff;
        }
        input:focus {
          border-color: #ff6600;
          outline: none;
        }
        .btn {
          display: inline-block;
          width: 100%;
          padding: 0.8rem;
          background-color: #ff6600;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
        }
        .btn:hover {
          background-color: #e65c00;
        }
        .footer {
          margin-top: 1rem;
          font-size: 0.85rem;
          color: #aaa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Authentication Required</h1>
        <p>You must authenticate to access My Resource</p>
        <form action="/login" method="POST">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="btn">Log In</button>
        </form>
        <div class="footer">Forgot your password?</div>
      </div>
    </body>
    </html>
  `);
});

// Route xử lý dữ liệu đăng nhập
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Email: ${email}, Password: ${password}`);
  // Thực hiện xác thực ở đây
  res.send('<h1>Login Successful</h1>');
});

// Lắng nghe server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
