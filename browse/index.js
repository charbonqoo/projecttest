const express = require('express');
const path = require('path');

const PORT = 8080;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public"))); // 静的ファイル（JS/CSSなど）

let dataString = "";

// HTMLをそのまま返す（テンプレート使わない）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "", "index.html"));
});

app.post('/', (req, res) => {
  dataString = req.body.data;
  // データを保存するだけ。リダイレクトでも可
  res.redirect('/');
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

