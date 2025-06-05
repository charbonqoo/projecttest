const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("docs")); // index.htmlなどを提供

// データ読み込み
const classrooms = JSON.parse(fs.readFileSync(path.join(__dirname, "data/classrooms.json")));
const availability = JSON.parse(fs.readFileSync(path.join(__dirname, "data/availability.json")));

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
  const now = new Date();
  const day = now.getDay(); // 0=日, 1=月, ..., 6=土
  const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
  let weekday = weekdayMap[day];
  let minutesNow = now.getHours() * 60 + now.getMinutes();

  if (weekday === "日") {
    // 日曜は翌日のデータ（=月曜）を表示
    weekday = "月";
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

  // 授業時間外（夜間など）
  return { weekday, period: null };
}

// ID配列から教室情報を取得
function filterClassroomsByIds(ids) {
  return classrooms.filter(c => ids.includes(c.id));
}

// 空き教室IDを取得（"0" = 空き）
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

// 任意の曜日・時限・建物でのフィルタ
app.get("/api/classrooms/available", (req, res) => {
  const { weekday, period, building } = req.query;
  if (!weekday || !period) return res.status(400).json({ error: "weekday and period required" });

  const availableIds = getAvailableIds(weekday, period, building);
  const results = filterClassroomsByIds(availableIds);
  res.json({ weekday, period, building, results });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
