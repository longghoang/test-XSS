@echo off
:: Hiển thị hộp thoại thông báo (dùng PowerShell để tạo popup)
powershell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('File BAT da duoc thuc thi! He thong cua ban co the bi tan cong.')"
:: Mở Notepad để chứng minh lệnh hệ thống chạy được
start notepad.exe
exit
