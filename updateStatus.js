const { google } = require('googleapis');

module.exports = async (req, res) => {
  // ตรวจสอบว่าต้องเป็น POST Method เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { invoice, status } = req.body;
    
    // ดึงค่ากุญแจจาก Environment Variables ใน Vercel
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1lPp5LuwT6lAt0wozRduI8ErarHk-5iwI5PWoZwmTZoY';

    // 1. อ่านข้อมูลเพื่อหาแถว
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '2026!A:F',
    });

    const rows = response.data.values;
    let rowIndex = -1;

    if (rows) {
      for (let i = 0; i < rows.length; i++) {
        // ค้นหาในคอลัมน์ E (index 4)
        if (rows[i][4] && rows[i][4].toString().trim().toUpperCase() === invoice.toUpperCase()) {
          rowIndex = i + 1;
          break;
        }
      }
    }

    if (rowIndex === -1) {
      return res.status(200).json({ success: false, message: "ບໍ່ພົບ Invoice: " + invoice });
    }

    // 2. อัปเดตสถานะในคอลัมน์ F (index 5)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `2026!F${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[status]] },
    });

    return res.status(200).json({ success: true, message: "ອັບເດດ " + invoice + " ສຳເລັດ!" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};