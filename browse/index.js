import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirnameの代替（ESM対応）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("docs")); // index.htmlなどを提供

// データ読み込み
const classrooms = JSON.parse(fs.readFileSync(path.join(__dirname, "data/classrooms.json"), "utf8"));
const availability = JSON.parse(fs.readFileSync(path.join(__dirname, "data/availability.json"), "utf8"));


app.get("/api/classrooms/available", (req, res) => {
  let { weekday, period, building } = req.query;

  if (!weekday || !period) {
    return res.status(400).json({ error: "weekday と period は必須です" });
  }

  weekday = weekday.replace("曜", "");
  period = period.replace("限", "");

  const dayData = availability[weekday];
  const periodData = dayData?.[period] || {};

  // statusのあるIDを数値で取得
  const statusMap = Object.fromEntries(
    Object.entries(periodData).map(([id, status]) => [parseInt(id, 10), status])
  );

  // classroomsにavailable情報を付けて返す
  const results = classrooms
    .filter(room => {
      return (
        (!building || building === "all" || room.building === `${building}号館`)
      );
    })
    .map(room => ({
      ...room,
      available: statusMap.hasOwnProperty(room.id)
        ? statusMap[room.id] === 0
          ? 0 // 空き
          : 1 // 使用中
        : null // データなし（表示しない or グレー表示など）
    }));

  res.json({ results });
});


// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});