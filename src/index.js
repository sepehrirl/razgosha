import { createRewardToken, getSafeErrorMessage } from "./game-guards.js";
import { CASES, getCase } from "./cases.js";
import { getStage, getStageClues, getStageCount, isFinalStage } from "./stage-engine.js";
import { getCasePage, getUnlockedCaseId } from "./case-pagination.js";
import { calculateCaseScore, getMistakeWarning, recordCaseMistake } from "./score-penalty.js";
import { getPaidHints, getPaidHintCost } from "./paid-hints.js";
import { LEADERBOARD_TYPES, rankLeaderboard } from "./leaderboard.js";
import { getStartExperience, FEATURED_CASES_LABEL } from "./start-experience.js";
import { buildAccountControls } from "./account-controls.js";
import { THEME_MENU_LABEL, getThemeMenuText, sendThemeDocument } from "./themes.js";

const MENU = {
  keyboard: [
    [{ text: FEATURED_CASES_LABEL }],
    [{ text: "🎯 مأموریت امروز" }, { text: "👤 پروفایل" }],
    [{ text: "🏆 رتبه‌بندی" }],
    [{ text: "🏅 دستاوردها" }, { text: "🎒 کوله‌باز" }],
    [{ text: THEME_MENU_LABEL }],
    [{ text: "ℹ️ راهنما" }]
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "راز بعدی رو انتخاب کن..."
};

const ACHIEVEMENTS = [
  ["first-case", "🕵️ کارآگاه تازه‌کار", "اولین پرونده‌ات رو حل کن"],
  ["clue-tracker", "🔎 ردیاب سرنخ", "۱۰ سرنخ از پرونده‌های حل‌شده جمع کن"],
  ["three-cases", "🔥 سه‌تایی", "۳ پرونده رو حل کن"],
  ["puzzle-solver", "🧩 حل‌کننده معما", "۵ پرونده چندمرحله‌ای رو حل کن"],
  ["five-cases", "🧠 کارآگاه حرفه‌ای", "۵ پرونده رو حل کن"],
  ["ten-cases", "📚 پرونده‌خوان", "۱۰ پرونده رو حل کن"],
  ["twenty-cases", "🎯 کارآگاه جدی", "۲۰ پرونده رو حل کن"],
  ["thirty-cases", "🧠 ذهن تحلیلگر", "۳۰ پرونده رو حل کن"],
  ["fifty-cases", "🔥 شکارچی راز", "۵۰ پرونده رو حل کن"],
  ["hundred-cases", "👑 استاد اعظم رازگشا", "هر ۱۰۰ پرونده رو حل کن"],
  ["perfect-streak", "⚡ زنجیره بی‌نقص", "۵ پرونده رو پشت‌سرهم بدون پاسخ اشتباه حل کن"],
  ["eagle-eye", "👁️ چشم عقاب", "یک پرونده سخت با شواهد کلیدی رو حل کن"],
  ["time-tracker", "🕰️ ردیاب زمان", "یک پرونده مبتنی بر زمان رو حل کن"],
  ["mastermind", "🎭 ذهن پشت پرده", "یک پرونده خیلی سخت رو حل کن"],
  ["impossible", "🧨 غیرممکن؟", "یک پرونده ویژه رو حل کن"]
];

const ITEMS = [["hint", "🔍 سرنخ اضافه"], ["remove", "💡 حذف یک گزینه"]];
const BACK = "↩️ بازگشت به منو";
const CASES_LABEL = "📁 پرونده‌های دیگر";
const PUZZLE_LABEL = "🧩 رفتن سراغ معما";
const HELP_LABEL = "ℹ️ راهنما";
const HELP_BACK = "↩️ بازگشت به راهنما";
const CLUE_LABELS = ["🔍 سرنخ ۱", "🔍 سرنخ ۲", "🔍 سرنخ ۳", "🔍 سرنخ ۴"];
const NEXT_STAGE = "➡️ مرحله بعد";
const PAID_HINTS_LABEL = "💡 خرید سرنخ";
const PAID_HINT_PREFIX = "💡 خرید سرنخ ";
const LEADERBOARD_METRICS = Object.fromEntries(LEADERBOARD_TYPES.map(([id, label]) => [label, id]));

const HELP_TOPICS = [
  ["🎮 نحوه بازی", "how-to"],
  ["📜 قوانین رازگشا", "rules"],
  ["🏆 امتیاز و رتبه‌بندی", "score"],
  ["🏅 دستاوردها", "achievements"],
  ["🎒 آیتم‌ها و کوله‌باز", "items"],
  ["🎯 مأموریت روزانه", "daily"],
  ["🔐 حساب کاربری", "account"],
  ["🕵️ نکات کارآگاهی", "tips"],
  ["👨‍💻 درباره رازگشا", "about"]
];

const HELP_CONTENT = {
  "how-to": `🎮 نحوه بازی\n\n🔎 از بخش «پرونده‌ها» یک پرونده باز رو انتخاب کن.\n\n🔍 سرنخ‌ها رو یکی‌یکی بررسی کن و جزئیات رو کنار هم بذار.\n\n🧩 وقتی آماده شدی، برو سراغ معما و یکی از چهار گزینه رو انتخاب کن.\n\n🏆 جواب درست یعنی پرونده حل شده و امتیازش ثبت می‌شه.\n\n🔓 پرونده‌ها به‌ترتیب باز می‌شن؛ پس هر پرونده بخشی از مسیرته.`,
  rules: `📜 قوانین رازگشا\n\n1️⃣ هر پرونده رو با دقت بررسی کن.\n2️⃣ قبل از جواب دادن، همه سرنخ‌ها رو بخون.\n3️⃣ حدس تصادفی راه خوبی برای حل پرونده نیست.\n4️⃣ هر پرونده فقط یک‌بار امتیاز اصلی خودش رو می‌ده.\n5️⃣ هر پاسخ اشتباه امتیاز همین پرونده رو کاهش می‌ده: ۵۰٪، بعد ۲۵٪، و بعد صفر.\n6️⃣ پرونده‌ها به‌ترتیب باز می‌شن.\n6️⃣ تقلب، سوءاستفاده یا تلاش برای خراب کردن سیستم ممنوعه.\n\n🕵️ اینجا قرار نیست فقط حدس بزنی؛ باید استدلال کنی.`,
  score: `🏆 امتیاز و رتبه‌بندی\n\n💰 هر پرونده برای حل درست، امتیاز خودش رو داره.\n\n⭐ با افزایش امتیاز، سطح کارآگاهت هم بالاتر می‌ره.\n\n🏆 بخش «رتبه‌بندی» بهترین کارآگاه‌ها رو نشون می‌ده.\n\n🎯 مأموریت روزانه هم می‌تونه به امتیازت اضافه کنه.\n\n⚠️ پاسخ اشتباه امتیاز پرونده رو کم می‌کنه: ۱ اشتباه = نصف، ۲ اشتباه = یک‌چهارم، ۳ اشتباه = صفر.\n\n🔥 هدف فقط حل کردن نیست؛ حرفه‌ای‌تر حل کن و بالاتر برو.`,
  achievements: `🏅 دستاوردها\n\nمسیر کارآگاهیت اینجاست.\n\n🟢 شروع: اولین، سومین و پنجمین پرونده\n🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده\n🟣 حرفه‌ای: ۵۰ و ۱۰۰ پرونده\n🟠 مهارت: ردیاب سرنخ و حل‌کننده معما\n🔴 مخفی: چشم عقاب، ردیاب زمان، ذهن پشت پرده و غیرممکن؟`,
