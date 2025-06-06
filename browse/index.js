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

// 授業時間と時限の対応
const periodSchedule = [
  { period: "1", start: "09:00", end: "10:30" },
  { period: "2", start: "10:45", end: "12:15" },
  { period: "3", start: "13:05", end: "14:35" },
  { period: "4", start: "14:50", end: "16:20" },
  { period: "5", start: "16:35", end: "18:05" }
];

// 時刻文字列を分に変換
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// 現在の曜日と時限を取得
function getCurrentWeekdayAndPeriod() {
  const now = dayjs().tz("Asia/Tokyo");
  const day = now.day(); // 0=日, 1=月, ..., 6=土
  const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
  let weekday = weekdayMap[day];
  let minutesNow = now.hour() * 60 + now.minute();

  if (weekday === "日") {
    weekday = "月"; // 日曜は翌日のデータ表示
    return { weekday, period: periodSchedule[0].period };
  }

  for (let i = 0; i < periodSchedule.length; i++) {
    const start = toMinutes(periodSchedule[i].start);
    const end = toMinutes(periodSchedule[i].end);
    if (minutesNow >= start && minutesNow <= end) {
      return { weekday, period: periodSchedule[i].period };
    }
    if (minutesNow < start) {
      return { weekday, period: periodSchedule[i].period }; // 次の時限
    }
  }

  return { weekday, period: null }; // 授業時間外
}

// ID配列から教室情報を取得
function filterClassroomsByIds(ids) {
  return classrooms.filter(c => ids.includes(c.id));
}

// 空き教室IDを取得（status === 0 が空き）
function getAvailableIds(weekday, period, building = null) {
  const dayData = availability[weekday];
  if (!dayData || !dayData[period]) return [];

  const idStatusMap = dayData[period];
  return Object.entries(idStatusMap)
    .filter(([id, status]) => status === 0)
    .map(([id]) => id)
    .filter(id => {
      if (!building) return true;
      const room = classrooms.find(c => c.id === id);
      return room && room.building === building;
    });
}

// --- API ---

// 現在の空き教室
app.get("/api/classrooms/available/now", (req, res) => {
  const { weekday, period } = getCurrentWeekdayAndPeriod();
  if (!period) return res.status(204).send(); // 授業時間外

  const availableIds = getAvailableIds(weekday, period);
  const results = filterClassroomsByIds(availableIds);
  res.json({ weekday, period, results });
});

// 任意の条件で空き教室取得
app.get("/api/classrooms/available", (req, res) => {
  const { weekday, period, building } = req.query;
  if (!weekday || !period) return res.status(400).json({ error: "weekday and period required" });

  const availableIds = getAvailableIds(weekday, period, building);
  const results = filterClassroomsByIds(availableIds);
  res.json({ weekday, period, building, results });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
