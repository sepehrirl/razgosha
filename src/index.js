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
  ["sixty-cases", "👑 استاد کارآگاهی", "هر ۶۰ پرونده رو حل کن"],
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
  achievements: `🏅 دستاوردها

مسیر کارآگاهیت اینجاست.

🟢 شروع: اولین، سومین و پنجمین پرونده
🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده
🟣 حرفه‌ای: ۵۰ و ۶۰ پرونده
🟠 مهارت: ردیاب سرنخ و حل‌کننده معما
🔴 مخفی: چشم عقاب، ردیاب زمان، ذهن پشت پرده و غیرممکن؟

📊 پیشرفت دستاوردهای قابل‌نمایش به شکل x/y دیده می‌شه.
🔒 بعضی نشان‌ها شرایط مخفی دارن و تا زمان کشف، هویت و شرطشون نمایش داده نمی‌شه.
🎁 هر نشان جدید می‌تونه جایزه امتیازی داشته باشه.`,
  items: `🎒 آیتم‌ها و کوله‌باز\n\n🎒 کوله‌باز جاییه که آیتم‌های کارآگاهی‌ات رو می‌بینی.\n\n🔍 سرنخ اضافه\n💡 حذف یک گزینه\n\nفعلاً زیرساخت آیتم‌ها آماده‌ست و با گسترش پرونده‌ها کاربردهای بیشتری پیدا می‌کنن.`,
  daily: `🎯 مأموریت روزانه\n\nهر روز می‌تونی مأموریت روزانه‌ات رو دریافت کنی.\n\n💰 جایزه فعلی: +۲۵ امتیاز\n🔥 با دریافت روزانه، استریکت هم ثبت می‌شه.\n\n⏰ اگر امروز جایزه رو گرفتی، باید تا روز بعد صبر کنی.`,
  account: `🔐 حساب کاربری\n\nبا زدن /start حساب کارآگاهی‌ات ساخته می‌شه.\n\n👤 اطلاعات پروفایل، امتیاز، سطح، استریک و پیشرفت پرونده‌ها به حسابت متصل می‌مونه.\n\n📱 اگر با همان حساب تلگرام برگردی، پیشرفتت هم همراهته.`,
  tips: `🕵️ نکات کارآگاهی\n\n🔍 همه سرنخ‌ها رو کنار هم بذار؛ یک سرنخ به‌تنهایی ممکنه گمراه‌کننده باشه.\n\n🧠 دنبال ارتباط بین زمان، افراد و اتفاق‌ها بگرد.\n\n👀 جزئیات کوچک رو دست‌کم نگیر.\n\n❌ اگر جوابت غلط بود، سریع حدس بعدی نزن؛ دوباره شواهد رو بررسی کن.\n\n🎯 رازگشا با استدلال حل می‌شه، نه شانس.`,
  about: `👨‍💻 درباره رازگشا\n\n🕵️ رازگشا یک بازی معمایی و کارآگاهی فارسیه؛ برای کسایی که دوست دارن از بین سرنخ‌ها به حقیقت برسن.\n\n👨‍💻 سازنده: @am_sepehr_s\n\n🔥 پرونده‌های بیشتر، مراحل پیچیده‌تر و سیستم‌های جدیدتر در راهه.\n\nآماده‌ای؟ پرونده بعدی منتظرته. 🔎`
};

function logEvent(event, details = {}) {
  console.log(JSON.stringify({ event, ...details, timestamp: new Date().toISOString() }));
}

async function telegram(env, method, body) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      logEvent("telegram_error", { method, status: response.status, description: result.description || "unknown" });
    }
    return result;
  } catch (error) {
    logEvent("telegram_error", { method, message: error?.message || "network_error" });
    throw error;
  }
}

function esc(text) {
  return String(text).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function keyboard(rows, placeholder = "راز بعدی رو انتخاب کن...") {
  return {
    keyboard: rows.map(row => row.map(text => ({ text }))),
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: placeholder
  };
}

function removeKeyboard() {
  return { remove_keyboard: true };
}

function caseListKeyboard(page = 1) {
  const { page: currentPage, totalPages } = getCasePage(CASES, page);
  const rows = [];
  const nav = [];
  if (currentPage > 1) nav.push(`◀️ صفحه ${currentPage - 1}`);
  if (currentPage < totalPages) nav.push(`صفحه ${currentPage + 1} ▶️`);
  if (nav.length) rows.push(nav);
  rows.push(["🎯 پرونده قابل انجام"]);
  rows.push([BACK]);
  return keyboard(rows, `پرونده‌ها — صفحه ${currentPage} از ${totalPages}`);
}
function caseButton(c) {
  return `📁 ${c.id.slice(-3)} — ${c.title.split("—")[1]?.trim() || c.title}`;
}

function caseKeyboard(c, step = 0) {
  const clues = getStageClues(c, step);
  const rows = [];
  for (let i = 0; i < clues.length; i += 2) {
    const row = [CLUE_LABELS[i] || `🔍 سرنخ ${i + 1}`];
    if (clues[i + 1]) row.push(CLUE_LABELS[i + 1] || `🔍 سرنخ ${i + 2}`);
    rows.push(row);
  }
  rows.push([isFinalStage(c, step) ? PUZZLE_LABEL : NEXT_STAGE]);
  rows.push([PAID_HINTS_LABEL]);
  rows.push([CASES_LABEL, BACK]);
  return keyboard(rows, isFinalStage(c, step) ? "معمای نهایی آماده‌ست..." : "شواهد رو بررسی کن...");
}
// PAID_HINTS_SYSTEM
async function paidHintsState(env, player, caseId) {
  const rows = await env.DB.prepare("SELECT hint_index FROM identity_paid_hints WHERE telegram_id=? AND case_id=? ORDER BY hint_index").bind(String(player.telegram_id), caseId).all();
  return new Set(rows.results.map(r => Number(r.hint_index)));
}

function paidHintsKeyboard(hints, purchased) {
  const rows = [];
  for (let i = 0; i < hints.length; i++) {
    const cost = getPaidHintCost(i);
    rows.push([purchased.has(i) ? `✅ سرنخ ${i + 1} — خریداری شده` : `💡 خرید سرنخ ${i + 1} — ${cost} امتیاز`]);
  }
  rows.push([BACK]);
  return keyboard(rows, "سرنخ کمکی می‌خوای؟");
}

async function showPaidHints(env, chatId, player, activeCase) {
  const hints = getPaidHints(activeCase, activeCase.current_step);
  const purchased = await paidHintsState(env, player, activeCase.id);
  const balance = Number(player.score || 0);
  const lines = hints.map((hint, i) => purchased.has(i) ? hint : `💡 سرنخ اضافه ${i + 1} — ${getPaidHintCost(i)} امتیاز`);
  return sendMessage(env, chatId, `💡 فروشگاه سرنخ\n\n💰 موجودی: ${balance} امتیاز\n\n${lines.join("\n")}\n\nاین سرنخ‌ها جدا از سرنخ‌های اصلی پرونده‌ان و فقط با امتیاز خریداری می‌شن.`, paidHintsKeyboard(hints, purchased), 650, "💡");
}

async function buyPaidHint(env, chatId, player, activeCase, hintIndex) {
  const index = Number(hintIndex);
  const cost = getPaidHintCost(index);
  const hints = getPaidHints(activeCase, activeCase.current_step);
  if (cost === null || !hints[index]) return showPaidHints(env, chatId, player, activeCase);

  const existing = await env.DB.prepare("SELECT 1 FROM identity_paid_hints WHERE telegram_id=? AND case_id=? AND hint_index=?").bind(String(player.telegram_id), activeCase.id, index).first();
  if (existing) {
    const purchased = await paidHintsState(env, player, activeCase.id);
    return sendMessage(env, chatId, `${hints[index]}\n\nاین سرنخ رو قبلاً خریدی 😉`, paidHintsKeyboard(hints, purchased), 700, "🔍");
  }

  const now = new Date().toISOString();
  const purchase = await env.DB.prepare("INSERT OR IGNORE INTO identity_paid_hints (telegram_id, case_id, hint_index, purchased_at) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id=? AND account_status='active')").bind(String(player.telegram_id), activeCase.id, index, now, player.id).run();
  if (Number(purchase?.meta?.changes || 0) !== 1) return showPaidHints(env, chatId, player, activeCase);

  const charged = await env.DB.prepare("UPDATE players SET score=score-?, updated_at=? WHERE id=? AND score>=? AND account_status='active'").bind(cost, now, player.id, cost).run();
  if (Number(charged?.meta?.changes || 0) !== 1) {
    await env.DB.prepare("DELETE FROM identity_paid_hints WHERE telegram_id=? AND case_id=? AND hint_index=?").bind(String(player.telegram_id), activeCase.id, index).run();
    return sendMessage(env, chatId, `❌ امتیازت برای این سرنخ کافی نیست.\n\n💰 هزینه: ${cost}\n🏆 موجودی: ${Number(player.score || 0)}`, paidHintsKeyboard(hints, new Set()), 550, "💰");
  }

  const updatedPlayer = await findPlayer(env, player.telegram_id);
  const purchased = await paidHintsState(env, updatedPlayer, activeCase.id);
  logEvent("paid_hint_purchased", { telegram_id: String(player.telegram_id), player_id: player.id, case_id: activeCase.id, hint_index: index, cost });
  return sendMessage(env, chatId, `✅ سرنخ خریداری شد!\n\n${hints[index]}\n\n💸 -${cost} امتیاز\n💰 موجودی جدید: ${Number(updatedPlayer?.score || 0)} امتیاز`, paidHintsKeyboard(hints, purchased), 800, "💡");
}

function puzzleKeyboard(c) {
  return keyboard([
    [`A) ${c.options[0]}`],
    [`B) ${c.options[1]}`],
    [`C) ${c.options[2]}`],
    [`D) ${c.options[3]}`],
    ["🔍 دیدن سرنخ‌ها", BACK]
  ], "جوابت رو انتخاب کن...");
}

function helpKeyboard() {
  return keyboard([
    [HELP_TOPICS[0][0], HELP_TOPICS[1][0]],
    [HELP_TOPICS[2][0], HELP_TOPICS[3][0]],
    [HELP_TOPICS[4][0], HELP_TOPICS[5][0]],
    [HELP_TOPICS[6][0], HELP_TOPICS[7][0]],
    [HELP_TOPICS[8][0]],
    [BACK]
  ], "موضوع راهنما رو انتخاب کن...");
}

function helpTopicKeyboard() {
  return keyboard([
    [HELP_BACK, BACK]
  ], "موضوع دیگه‌ای می‌خوای؟");
}

function helpTopicId(text) {
  const topic = HELP_TOPICS.find(([label]) => label === text);
  return topic?.[1] || null;
}

async function sendTyping(env, chatId, durationMs = 650) {
  try {
    await telegram(env, "sendChatAction", { chat_id: chatId, action: "typing" });
    if (durationMs > 0) await new Promise(resolve => setTimeout(resolve, durationMs));
  } catch (error) {
    logEvent("typing_error", { chat_id: chatId, message: error?.message || "unknown" });
  }
}

async function sendMessage(env, chatId, text, reply_markup = MENU, typingMs = 650, reaction = null) {
  await sendTyping(env, chatId, typingMs);
  const result = await telegram(env, "sendMessage", { chat_id: chatId, text, reply_markup });
  const messageId = result?.result?.message_id;
  if (reaction && messageId) {
    try {
      await telegram(env, "setMessageReaction", {
        chat_id: chatId,
        message_id: messageId,
        reaction: [{ type: "emoji", emoji: reaction }],
        is_big: false
      });
    } catch (error) {
      logEvent("reaction_error", { chat_id: chatId, message_id: messageId, reaction, message: error?.message || "unknown" });
    }
  }
  return result;
}

async function findPlayer(env, telegramId) {
  return env.DB.prepare("SELECT * FROM players WHERE telegram_id = ? AND account_status = 'active'").bind(String(telegramId)).first();
}

async function createAccount(env, from) {
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO players (telegram_id, username, first_name, detective_name, score, level, account_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, 1, 'active', ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name, account_status='active', updated_at=excluded.updated_at`)
    .bind(String(from.id), from.username || null, from.first_name || "کارآگاه", from.first_name || "کارآگاه", now, now).run();
  const player = await findPlayer(env, from.id);
  await env.DB.batch(ITEMS.map(([id]) => env.DB.prepare(`INSERT INTO player_inventory (player_id, item_id, quantity) VALUES (?, ?, 0) ON CONFLICT(player_id, item_id) DO NOTHING`).bind(player.id, id)));
  return player;
}

async function requireAccount(env, chatId, telegramId) {
  const player = await findPlayer(env, telegramId);
  if (player) return player;
  await sendMessage(env, chatId, "🔐 اول باید حساب رازگشات رو بسازی.\n\nفقط /start رو بزن تا پروفایلت ساخته بشه؛ بعدش بزن بریم سراغ پرونده‌ها 😎", removeKeyboard(), 350);
  return null;
}

async function sendMenu(env, chatId, text = "🕵️ برگشتی کارآگاه!\n\nخب، امروز کدوم پرونده رو می‌خوای بترکونی؟", reaction = "👀") {
  return sendMessage(env, chatId, text, MENU, 550, reaction);
}

async function showCases(env, chatId, player, page = 1) {
  const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
  const progress = new Map(rows.results.map(r => [r.case_id, Number(r.solved || 0)]));
  const solvedIds = new Set([...progress].filter(([, solved]) => solved).map(([id]) => id));
  const { items, page: currentPage, totalPages } = getCasePage(CASES, page);
  const unlockedId = getUnlockedCaseId(CASES, solvedIds);
  const lines = items.map(c => {
    const solved = progress.get(c.id) === 1;
    const unlocked = c.id === unlockedId;
    return `${solved ? "✅" : unlocked ? "🟢" : "🔒"} ${c.title} — ${c.difficulty} — ${c.reward} امتیاز`;
  }).join("\n");
  const target = getCase(unlockedId);
  const text = `📁 آرشیو پرونده‌ها\n\n${lines}\n\n📄 صفحه ${currentPage} از ${totalPages}\n\n${target ? `🎯 پرونده قابل انجام: ${target.title}\nبا دکمه «پرونده قابل انجام» شروعش کن.` : "👑 همه پرونده‌های فعلی رو حل کردی!"}`;
  return sendMessage(env, chatId, text, caseListKeyboard(currentPage), 750, "🔍");
}
async function startCase(env, chatId, player, caseId) {
  const c = getCase(caseId);
  if (!c) return sendMenu(env, chatId, "این پرونده رو پیدا نکردم 😅", "🤔");
  const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
  const solved = new Set(rows.results.filter(r => Number(r?.solved || 0) === 1).map(r => r.case_id));
  const idx = CASES.findIndex(x => x.id === caseId);
  if (idx > 0 && !solved.has(CASES[idx - 1].id)) return sendMenu(env, chatId, "🔒 این پرونده هنوز باز نیست. اول پرونده بعدیِ مسیرت رو حل کن 😉", "🔒");
  const existing = await env.DB.prepare("SELECT current_step, solved, wrong_guesses FROM player_progress WHERE player_id=? AND case_id=?").bind(player.id, c.id).first();
  if (!existing || Number(existing.solved || 0) === 1) {
    await env.DB.prepare(`INSERT INTO player_progress (player_id, case_id, current_step, solved, wrong_guesses, updated_at) VALUES (?, ?, 0, 0, 0, ?) ON CONFLICT(player_id, case_id) DO UPDATE SET current_step=0, solved=0, wrong_guesses=0, updated_at=excluded.updated_at`).bind(player.id, c.id, new Date().toISOString()).run();
  }
  const step = existing && Number(existing.solved || 0) !== 1 ? Number(existing.current_step || 0) : 0;
  const stage = getStage(c, step);
  const activeWarning = isFinalStage(c, step) ? `\n\n${getMistakeWarning(Number(existing?.wrong_guesses || 0))}` : "";
  return sendMessage(env, chatId, `📂 ${c.title}\n\n${c.intro}\n\n👥 مظنون‌ها:\n${c.suspects.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n🧩 مرحله ${step + 1}/${getStageCount(c)} — ${stage?.title || "بررسی شواهد"}\n\nسرنخ‌ها رو با دقت بررسی کن؛ عجله نکن 👀${activeWarning}`, caseKeyboard(c, step), 1100, "🕵️");
}
async function getActiveCase(env, playerId) {
  const row = await env.DB.prepare("SELECT case_id, current_step, wrong_guesses FROM player_progress WHERE player_id=? AND solved=0 ORDER BY updated_at DESC, id DESC LIMIT 1").bind(playerId).first();
  if (!row) return null;
  const c = getCase(row.case_id);
  return c ? { ...c, current_step: Number(row.current_step || 0), wrong_guesses: Number(row.wrong_guesses || 0) } : null;
}
async function resetAccount(env, chatId, player) {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM player_progress WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM case_rewards WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_achievements WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_inventory WHERE player_id=?").bind(player.id),
    env.DB.prepare("UPDATE players SET score=0, level=1, streak=0, last_daily_claim=NULL, clues_viewed=0, puzzles_solved=0, perfect_streak=0, account_status='active', updated_at=? WHERE id=?").bind(now, player.id)
  ]);
  logEvent("account_reset", { player_id: player.id, telegram_id: String(player.telegram_id) });
  return sendMenu(env, chatId, "🔄 اکانتت ری‌استارت شد!\n\nهمه‌چی از صفر شروع شد؛ خود حساب و هویتت سر جاشه.\n\nحالا بیا ببینیم این بار چند پرونده رو می‌ترکونی 😎🔥", "🔄");
}

async function deleteAccount(env, chatId, player) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM player_progress WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM case_rewards WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_achievements WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_inventory WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM players WHERE id=?").bind(player.id)
  ]);
  logEvent("account_deleted", { player_id: player.id, telegram_id: String(player.telegram_id) });
  return sendMessage(env, chatId, "🗑️ حسابت پاک شد.\n\nهر وقت خواستی برگردی، فقط /start رو بزن و از اول شروع کن. 👋", removeKeyboard(), 450, "🗑️");
}

async function accountSettings(env, chatId, player) {
  const controls = buildAccountControls();
  return sendMessage(env, chatId, `⚙️ حساب کارآگاهی\n\n👤 ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 ${player.score || 0} امتیاز\n⭐ سطح ${player.level || 1}\n\nاز اینجا می‌تونی حسابت رو ری‌استارت کنی یا برای همیشه حذفش کنی.`, keyboard([
    [controls.reset.button],
    [controls.delete.button],
    [BACK]
  ], "مدیریت حساب..."), 550, "⚙️");
}

async function confirmAccountAction(env, chatId, player, action) {
  const controls = buildAccountControls();
  const item = controls[action];
  const confirm = action === "reset" ? "✅ بله، ری‌استارت کن" : "🗑️ بله، حذفش کن";
  const cancel = "❌ نه، بی‌خیال";
  return sendMessage(env, chatId, `${item.confirmation}\n\nاگر مطمئنی، دکمه تأیید رو بزن.`, keyboard([[confirm], [cancel, BACK]], "تأیید عملیات..."), 500, "⚠️");
}

async function legacyProfile(env, chatId, player) {
  const stats = await env.DB.prepare("SELECT COUNT(*) AS total, SUM(solved) AS solved FROM player_progress WHERE player_id = ?").bind(player.id).first();
  return sendMessage(env, chatId, `👤 پروفایل کارآگاه\n\n🪪 اسم: ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 امتیاز: ${player.score}\n⭐ سطح: ${player.level}\n📁 پرونده‌های حل‌شده: ${stats.solved || 0}\n🔥 استریک روزانه: ${player.streak || 0}\n\nآروم‌آروم بیا بالا؛ رتبه‌ها منتظرتن 😎`, MENU, 550, "👤");
}

async function profile(env, chatId, player) {
  const solved = await env.DB.prepare("SELECT COUNT(*) AS count FROM player_progress WHERE player_id=? AND solved=1").bind(player.id).first();
  const solvedCount = Number(solved?.count || 0);
  const controls = buildAccountControls();
  return sendMessage(env, chatId, `👤 پروفایل کارآگاهی\n\n🕵️ ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 امتیاز: ${player.score || 0}\n⭐ سطح: ${player.level || 1}\n🔥 استریک: ${player.streak || 0}\n📁 پرونده‌های حل‌شده: ${solvedCount}\n\n⚙️ مدیریت حساب`, keyboard([
    [controls.reset.button, controls.delete.button],
    [BACK]
  ], "پروفایل کارآگاهی..."), 550, "👤");
}

async function leaderboardRows(env) {
  const result = await env.DB.prepare(
    "SELECT p.telegram_id, p.first_name, p.detective_name, p.score, p.streak, p.best_streak, COALESCE(SUM(CASE WHEN pp.solved=1 THEN 1 ELSE 0 END), 0) AS solved, COALESCE(SUM(CASE WHEN pp.solved=1 THEN 0 ELSE pp.wrong_guesses END), 0) AS wrong_guesses FROM players p LEFT JOIN player_progress pp ON pp.player_id=p.id WHERE p.account_status='active' GROUP BY p.id"
  ).all();
  return result.results || [];
}

function leaderboardKeyboard() {
  return keyboard([
    [LEADERBOARD_TYPES[0][1], LEADERBOARD_TYPES[1][1]],
    [LEADERBOARD_TYPES[2][1], LEADERBOARD_TYPES[3][1]],
    [BACK]
  ], "نوع رتبه‌بندی...");
}

function leaderboardValueText(metric, row) {
  if (metric === "accuracy") return `🎯 ${row.value}% دقت`;
  if (metric === "solved") return `🧠 ${row.value} پرونده`;
  if (metric === "streak") return `🔥 ${row.value} روز`;
  return `🏆 ${row.value} امتیاز`;
}

async function rank(env, chatId, player, metric = "score") {
  const rows = await leaderboardRows(env);
  const result = rankLeaderboard(rows, metric, String(player?.telegram_id || ""), 10);
  const meta = LEADERBOARD_TYPES.find(x => x[0] === metric) || LEADERBOARD_TYPES[0];
  const medals = ["🥇", "🥈", "🥉"];
  const lines = result.top.map((p, i) => `${medals[i] || `#${p.rank}`} ${esc(p.detective_name || p.first_name || "کارآگاه")} — ${leaderboardValueText(metric, p)}`).join("\n") || "هنوز رکوردی ثبت نشده.";
  const me = result.current;
  const myLine = me && me.rank > 10 ? `\n\n📍 رتبه تو: #${me.rank} — ${leaderboardValueText(metric, me)}` : me ? `\n\n📍 رتبه تو: #${me.rank}` : "";
  return sendMessage(env, chatId, `👑 لیدربورد رازگشا\n\n${meta[1]}\n\n${lines}${myLine}\n\n🔥 رقابت ادامه داره؛ جای تو بین بهترین‌ها خالیه!`, leaderboardKeyboard(), 700, "🏆");
}

async function achievements(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT achievement_id FROM player_achievements WHERE player_id=?").bind(player.id).all();
  const unlocked = new Set(rows.results.map(r => r.achievement_id));
  const progressRows = await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(player.id).all();
  const solvedIds = new Set(progressRows.results.map(r => r.case_id));
  const solved = solvedIds.size;
  const solvedCases = CASES.filter(c => solvedIds.has(c.id));
  const clueCount = solvedCases.reduce((sum, c) => sum + (Array.isArray(c.clues) ? c.clues.length : 0), 0);
  const multiStageCount = solvedCases.filter(c => getStageCount(c) >= 3).length;
  const progress = {
    "first-case": [solved, 1], "clue-tracker": [clueCount, 10], "three-cases": [solved, 3],
    "puzzle-solver": [multiStageCount, 5], "five-cases": [solved, 5], "ten-cases": [solved, 10],
    "twenty-cases": [solved, 20], "thirty-cases": [solved, 30], "fifty-cases": [solved, 50], "sixty-cases": [solved, 60]
  };
  const hidden = new Set(["perfect-streak", "eagle-eye", "time-tracker", "mastermind", "impossible"]);
  const visible = ACHIEVEMENTS.map(a => {
    if (hidden.has(a[0]) && !unlocked.has(a[0])) return "🔒 دستاورد مخفی — هنوز کشف نشده";
    const p = progress[a[0]];
    const suffix = p ? ` — ${Math.min(Number(p[0]), Number(p[1]))}/${p[1]}` : " — کشف‌شده";
    return `${unlocked.has(a[0]) ? "🏅" : "🔒"} ${a[1]}${suffix}`;
  });
  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.has(a[0])).length;
  const text = [
    "🏅 دستاوردها", "", `📊 ${unlockedCount}/${ACHIEVEMENTS.length} نشان باز شده`, "",
    "🟢 شروع", ...visible.slice(0, 3), "",
    "🔵 پیشرفت", ...visible.slice(3, 6), "",
    "🟣 حرفه‌ای", ...visible.slice(6, 8), "",
    "🟠 مهارت", ...visible.slice(8, 10), "",
    "🔴 مخفی", ...visible.slice(10), "",
    "🎁 هر بار که نشان جدیدی باز کنی، همون لحظه بهت خبر می‌دم."
  ].join("\n");
  return sendMessage(env, chatId, text, MENU, 700, "🏅");
}
async function inventory(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT item_id, quantity FROM player_inventory WHERE player_id = ?").bind(player.id).all();
  const names = Object.fromEntries(ITEMS);
  const text = rows.results.map(r => `${names[r.item_id] || r.item_id}: ${r.quantity}`).join("\n");
  return sendMessage(env, chatId, `🎒 کوله‌بازیت\n\n${text || "فعلاً خالیه."}\n\nآیتم‌ها بعداً توی پرونده‌ها به کارت میان 😉`, MENU, 600, "🎒");
}

async function daily(env, chatId, player) {
  const today = new Date().toISOString().slice(0, 10);
  if (player.last_daily_claim === today) return sendMessage(env, chatId, "🎯 مأموریت امروز رو قبلاً گرفتی!\n\nفردا دوباره یه مأموریت تازه داریم 😎", MENU, 600, "🎯");
  const newScore = (player.score || 0) + 25;
  const newStreak = (player.streak || 0) + 1;
  await env.DB.prepare("UPDATE players SET score=?, streak=?, best_streak=MAX(best_streak, ?), last_daily_claim=?, updated_at=? WHERE id=?").bind(newScore, newStreak, newStreak, today, new Date().toISOString(), player.id).run();
  return sendMessage(env, chatId, `🎯 مأموریت امروز انجام شد!\n\n💰 +۲۵ امتیاز\n🔥 استریک: ${newStreak} روز\n\nهمین‌جوری ادامه بده کارآگاه؛ فردا هم یه جایزه داریم 👀`, MENU, 800, "🎉");
}

async function showHelp(env, chatId, reaction = "ℹ️") {
  return sendMessage(env, chatId, "ℹ️ مرکز راهنمای رازگشا\n\nهر چیزی که برای حرفه‌ای شدن در رازگشا لازم داری اینجاست.\n\nیک موضوع رو انتخاب کن 👇", helpKeyboard(), 800, reaction);
}

async function showHelpTopic(env, chatId, topicId) {
  const text = HELP_CONTENT[topicId];
  if (!text) return showHelp(env, chatId, "🤔");
  return sendMessage(env, chatId, text, helpTopicKeyboard(), 850, "🔎");
}

async function awardCaseScore(env, telegramId, playerId, caseId) {
  const c = getCase(caseId);
  if (!c) throw new Error(`unknown_case:${caseId}`);
  const progress = await env.DB.prepare("SELECT wrong_guesses FROM player_progress WHERE player_id=? AND case_id=? AND solved=0").bind(playerId, caseId).first();
  const points = calculateCaseScore(c.reward, progress?.wrong_guesses || 0);
  const rewardToken = createRewardToken();
  const now = new Date().toISOString();
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO case_rewards (player_id, case_id, reward_token, awarded_at)
      SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM player_progress WHERE player_id=? AND case_id=? AND solved=0)`).bind(playerId, caseId, rewardToken, now, playerId, caseId),
    env.DB.prepare(`UPDATE players SET score=score+?, level=CAST((score+?)/500 AS INTEGER)+1, updated_at=? WHERE id=? AND EXISTS (SELECT 1 FROM case_rewards WHERE player_id=? AND case_id=? AND reward_token=?)`).bind(points, points, now, playerId, playerId, caseId, rewardToken),
    env.DB.prepare(`UPDATE player_progress SET solved=1, current_step=current_step+1, updated_at=? WHERE player_id=? AND case_id=? AND solved=0 AND EXISTS (SELECT 1 FROM case_rewards WHERE player_id=? AND case_id=? AND reward_token=?)`).bind(now, playerId, caseId, playerId, caseId, rewardToken)
  ]);
  const inserted = Number(result[0]?.meta?.changes || 0);
  const updated = Number(result[1]?.meta?.changes || 0);
  const progressUpdated = Number(result[2]?.meta?.changes || 0);
  if (!inserted || !updated || !progressUpdated) {
    logEvent("game_reward_not_recorded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, inserted, updated, progressUpdated });
    return false;
  }
  logEvent("game_reward_awarded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, points, base_points: c.reward, wrong_guesses: Number(progress?.wrong_guesses || 0) });
  return { awarded: true, points };
}

async function unlockAchievements(env, playerId) {
  const rows = await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(playerId).all();
  const solvedIds = new Set(rows.results.map(r => r.case_id));
  const solved = solvedIds.size;
  const solvedCases = CASES.filter(c => solvedIds.has(c.id));
  const clueCount = solvedCases.reduce((sum, c) => sum + (Array.isArray(c.clues) ? c.clues.length : 0), 0);
  const multiStageCount = solvedCases.filter(c => getStageCount(c) >= 3).length;
  const wanted = [];

  if (solved >= 1) wanted.push("first-case");
  if (clueCount >= 10) wanted.push("clue-tracker");
  if (solved >= 3) wanted.push("three-cases");
  if (multiStageCount >= 5) wanted.push("puzzle-solver");
  if (solved >= 5) wanted.push("five-cases");
  if (solved >= 10) wanted.push("ten-cases");
  if (solved >= 20) wanted.push("twenty-cases");
  if (solved >= 30) wanted.push("thirty-cases");
  if (solved >= 50) wanted.push("fifty-cases");
  if (solved >= 60) wanted.push("sixty-cases");

  const hiddenCase = solvedCases.some(c => {
    const text = `${c.title} ${c.intro} ${(c.clues || []).join(" ")}`;
    return c.difficulty === "سخت" && /کلیدی|مهم|اثرگذار/.test(text);
  });
  const timeCase = solvedCases.some(c => /زمان|ساعت|دقیقه|تاریخ|بازه|timeline|خط زمانی/i.test(`${c.title} ${c.intro} ${(c.clues || []).join(" ")}`));
  const veryHard = solvedCases.some(c => /خیلی سخت|نابغه|genius/i.test(String(c.difficulty || "")));
  const special = solvedCases.some(c => /ویژه|special/i.test(String(c.difficulty || "")));
  if (hiddenCase) wanted.push("eagle-eye");
  if (timeCase) wanted.push("time-tracker");
  if (veryHard) wanted.push("mastermind");
  if (special) wanted.push("impossible");

  const rewards = {
    "first-case": 10, "clue-tracker": 15, "three-cases": 15, "puzzle-solver": 25,
    "five-cases": 20, "ten-cases": 30, "twenty-cases": 40, "thirty-cases": 50,
    "fifty-cases": 75, "sixty-cases": 100, "perfect-streak": 50,
    "eagle-eye": 25, "time-tracker": 25, "mastermind": 35, "impossible": 50
  };

  const newlyUnlocked = [];
  for (const id of wanted) {
    const result = await env.DB.prepare("INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)").bind(playerId, id, new Date().toISOString()).run();
    if (Number(result?.meta?.changes || 0) > 0) newlyUnlocked.push(id);
  }
  for (const id of newlyUnlocked) {
    const reward = rewards[id] || 0;
    if (reward) await env.DB.prepare("UPDATE players SET score=score+?, updated_at=? WHERE id=?").bind(reward, new Date().toISOString(), playerId).run();
  }
  return newlyUnlocked;
}
async function notifyNewAchievements(env, chatId, achievementIds) {
  if (!Array.isArray(achievementIds) || achievementIds.length === 0) return;
  const names = new Map(ACHIEVEMENTS.map(([id, name]) => [id, name]));
  const lines = achievementIds
    .map(id => names.get(id))
    .filter(Boolean)
    .map(name => `🏅 ${name}`);
  if (!lines.length) return;
  try {
    await sendMessage(
      env,
      chatId,
      `🎉 دستاورد جدید!\n\n${lines.join("\n")}\n\nآفرین کارآگاه! این نشان برای همیشه توی پروفایلت ثبت شد 🔥`,
      MENU,
      350,
      "🏅"
    );
  } catch (error) {
    logEvent("achievement_notification_error", { chat_id: chatId, achievement_ids: achievementIds, message: error?.message || "unknown" });
  }
}

export function getSolvedCaseIds(rows) {
  return new Set((rows || []).filter(r => Number(r?.solved || 0) === 1).map(r => r.case_id));
}

function caseFromButton(text) {
  const match = String(text || "").match(/^📁 (\d{3}) —/);
  return match ? `case-${match[1]}` : null;
}

function answerIndex(c, text) {
  const value = String(text || "").trim();
  const match = value.match(/^([ABCD])\)\s*/);
  if (!match) return -1;
  const index = "ABCD".indexOf(match[1]);
  const option = c.options[index];
  return value === `${match[1]}) ${option}` ? index : -1;
}

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  const text = String(message.text || "").trim();

  if (text === "/start") {
    const existing = await findPlayer(env, message.from.id);
    const identity = await env.DB.prepare("SELECT 1 FROM player_identities WHERE telegram_id=? LIMIT 1").bind(String(message.from.id)).first();
    const isFirstStart = !existing && !identity;
    const player = await createAccount(env, message.from);
    const experience = getStartExperience(isFirstStart, esc(player.detective_name || player.first_name || "کارآگاه"));
    return sendMenu(env, chatId, experience.text, "🎉");
  }

  const player = await requireAccount(env, chatId, message.from.id);
  if (!player) return;

  if (text === "/menu" || text === BACK || text === "🏠 منو") return sendMenu(env, chatId);
  if (text === "/profile" || text === "👤 پروفایل") return profile(env, chatId, player);
  if (text === "🔄 ری‌استارت حساب") return confirmAccountAction(env, chatId, player, "reset");
  if (text === "🗑️ حذف حساب") return confirmAccountAction(env, chatId, player, "delete");
  if (text === "❌ نه، بی‌خیال") return profile(env, chatId, player);
  if (text === "✅ بله، ری‌استارت کن") return resetAccount(env, chatId, player);
  if (text === "🗑️ بله، حذفش کن") return deleteAccount(env, chatId, player);
  if (text === "/rank" || text === "🏆 رتبه‌بندی") return rank(env, chatId, player, "score");
  if (LEADERBOARD_METRICS[text]) return rank(env, chatId, player, LEADERBOARD_METRICS[text]);
  if (text === "/cases" || text === "🔎 پرونده‌ها" || text === FEATURED_CASES_LABEL || text === CASES_LABEL) return showCases(env, chatId, player, 1);
  if (text.replace(/[\u200c\u200d\ufe0f]/g, "") === "🎯 پرونده قابل انجام" || text.includes("پرونده قابل انجام")) {
    try {
      const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
      const solvedIds = getSolvedCaseIds(rows?.results || []);
      const nextId = getUnlockedCaseId(CASES, solvedIds);
      logEvent("playable_case_requested", { telegram_id: String(message.from.id), player_id: player.id, next_case_id: nextId || null, solved_count: solvedIds.size });
      if (!nextId) return sendMenu(env, chatId, "👑 همه پرونده‌های فعلی رو حل کردی!", "🎉");
      return await startCase(env, chatId, player, nextId);
    } catch (error) {
      logEvent("playable_case_error", { telegram_id: String(message.from.id), player_id: player.id, message: error?.message || "unknown" });
      return sendMessage(env, chatId, "⚠️ پرونده قابل انجام فعلاً نتونست باز بشه. دوباره بزن؛ اگر باز هم نشد، مشکل رو ثبت کردم و می‌تونم دقیق‌تر بررسیش کنم. 🔎", caseListKeyboard(1), 350, "⚠️");
    }
  }
  const pageNav = text.match(/^(?:◀️ صفحه (\d+)|صفحه (\d+) ▶️)$/);
  if (pageNav) return showCases(env, chatId, player, Number(pageNav[1] || pageNav[2]));
  if (text === "🎯 مأموریت امروز") return daily(env, chatId, player);
  if (text === "🏅 دستاوردها") return achievements(env, chatId, player);
  if (text === "🎒 کوله‌باز") return inventory(env, chatId, player);
  if (text === THEME_MENU_LABEL) {
      await telegram(env, "sendMessage", {
        chat_id: message.chat.id,
        text: getThemeMenuText(),
        reply_markup: {
          keyboard: [
            [{ text: "📱 دانلود تم موبایل" }],
            [{ text: "🖥️ دانلود تم دسکتاپ" }],
            [{ text: BACK }]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      });
      return;
    }

    if (text === "📱 دانلود تم موبایل") {
      await sendThemeDocument(env, message.chat.id, "mobile", "📱 تم Dark Detective Green رازگشا برای موبایل\n\nفایل رو باز کن و در تلگرام اعمالش کن. 🟢🕵️‍♂️");
      return;
    }

    if (text === "🖥️ دانلود تم دسکتاپ") {
      await sendThemeDocument(env, message.chat.id, "desktop", "🖥️ تم Dark Detective Green رازگشا برای دسکتاپ\n\nفایل رو باز کن و در تنظیمات ظاهر تلگرام اعمالش کن. 🟢🕵️‍♂️");
      return;
    }

    if (text === HELP_LABEL) return showHelp(env, chatId);

  const helpTopic = helpTopicId(text);
  if (helpTopic) return showHelpTopic(env, chatId, helpTopic);
  if (text === HELP_BACK) return showHelp(env, chatId);

  const caseId = caseFromButton(text);
  if (caseId) return startCase(env, chatId, player, caseId);

  const activeCase = await getActiveCase(env, player.id);
  if (activeCase) {
    const stage = getStage(activeCase, activeCase.current_step);
    if (text === PAID_HINTS_LABEL) return showPaidHints(env, chatId, player, activeCase);
    if (text.startsWith(PAID_HINT_PREFIX)) {
      const match = text.match(/^💡 خرید سرنخ (\d+) — \d+ امتیاز$/);
      if (match) return buyPaidHint(env, chatId, player, activeCase, Number(match[1]) - 1);
    }
    const stageClues = getStageClues(activeCase, activeCase.current_step);
    const clueIndex = CLUE_LABELS.indexOf(text);
    if (clueIndex >= 0 && stageClues[clueIndex]) {
      return sendMessage(env, chatId, `🔍 مرحله ${activeCase.current_step + 1} — سرنخ ${clueIndex + 1}\n\n${stageClues[clueIndex]}\n\nاین جزئیات رو یادت بمونه؛ ممکنه در مرحله بعد معنی جدیدی پیدا کنه 👀`, caseKeyboard(activeCase, activeCase.current_step), 900, "🔍");
    }
    if (text === NEXT_STAGE && !isFinalStage(activeCase, activeCase.current_step)) {
      const nextStep = activeCase.current_step + 1;
      await env.DB.prepare("UPDATE player_progress SET current_step=?, updated_at=? WHERE player_id=? AND case_id=? AND solved=0").bind(nextStep, new Date().toISOString(), player.id, activeCase.id).run();
      const nextStage = getStage(activeCase, nextStep);
      if (isFinalStage(activeCase, nextStep)) return sendMessage(env, chatId, `🧩 مرحله نهایی\n\n${nextStage.question}\n\nحالا همه شواهد رو کنار هم بذار.\n\n${getMistakeWarning(activeCase.wrong_guesses)}`, puzzleKeyboard(nextStage), 1000, "🧩");
      return sendMessage(env, chatId, `🕵️ مرحله ${nextStep + 1}/${getStageCount(activeCase)} — ${nextStage.title}\n\nسرنخ‌های جدید رو بررسی کن.`, caseKeyboard(activeCase, nextStep), 900, "➡️");
    }
    if (text === PUZZLE_LABEL && isFinalStage(activeCase, activeCase.current_step)) {
      return sendMessage(env, chatId, `🧩 خب... رسیدیم به اصل ماجرا!\n\n${stage.question}\n\n${getMistakeWarning(activeCase.wrong_guesses)}\n\nفقط یکی از این جواب‌ها با شواهد جور درمیاد.`, puzzleKeyboard(stage), 950, "🧩");
    }
    if (text === "🔍 دیدن سرنخ‌ها") return startCase(env, chatId, player, activeCase.id);

    const finalCase = { ...activeCase, question: stage.question || activeCase.question, options: stage.options || activeCase.options, answer: stage.answer ?? activeCase.answer };
    const index = answerIndex(finalCase, text);
    if (index >= 0) {
      if (index !== finalCase.answer) {
        const mistake = await recordCaseMistake(env, player.id, activeCase.id);
        const warning = getMistakeWarning(mistake.wrongGuesses);
        const penaltyText = mistake.wrongGuesses >= 3
          ? "💥 امتیاز این پرونده دیگه صفره."
          : `📉 ضریب امتیاز این پرونده: ${Math.round((1 / (2 ** mistake.wrongGuesses)) * 100)}٪`;
        return sendMessage(env, chatId, `❌ نه، این یکی با شواهد جور درنمیاد.\n\n${penaltyText}\n\n${warning}\n\n${finalCase.question}\n\nدوباره شواهد رو مرور کن؛ این بار با دقت‌تر کارآگاه 😉`, puzzleKeyboard(finalCase), 850, "🤔");
      }
      try {
        const awarded = await awardCaseScore(env, message.from.id, player.id, activeCase.id);
        if (!awarded) return sendMenu(env, chatId, "✅ این پرونده قبلاً حل شده.\n\nبریم سراغ پرونده بعدی؟ 😎", "🏆");
            const newlyUnlocked = await unlockAchievements(env, player.id);
            await notifyNewAchievements(env, chatId, newlyUnlocked);
        const nextId = getUnlockedCaseId(CASES, new Set([...(await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(player.id).all()).results.map(r => r.case_id)]));
        const nextCase = getCase(nextId);
        const nextText = nextCase ? `\n\n➡️ پرونده بعدی: ${nextCase.title}\nاز «پرونده قابل انجام» ادامه بده.` : "\n\n👑 تو هر ۶۰ پرونده رو پشت سر گذاشتی!";
        return sendMenu(env, chatId, `${activeCase.success}\n\n💰 +${awarded.points} امتیاز\n\n📁 پرونده ثبت شد.${nextText}`, "🎉");
      } catch (error) {
        logEvent("game_answer_error", { telegram_id: String(message.from.id), player_id: player.id, case_id: activeCase.id, message: error?.message || "unknown" });
        return sendMessage(env, chatId, "⚠️ جواب درست بود، ولی ثبت پرونده با مشکل روبه‌رو شد.\n\nچند لحظه بعد دوباره همین گزینه رو بزن. 👀", puzzleKeyboard(finalCase), 700, "⚠️");
      }
    }
  }
  return sendMenu(env, chatId, "حاجی اینو نفهمیدم 😅\n\nاز دکمه‌های پایین صفحه استفاده کن یا /menu رو بزن.", "🤔");
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") return new Response("Razgosha is running 🕵️", { status: 200 });
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      const update = await request.json();
      if (update.message) await handleMessage(env, update.message);
      return new Response("ok", { status: 200 });
    } catch (error) {
      logEvent("worker_error", { message: error?.message || "unknown" });
      return new Response(getSafeErrorMessage(error), { status: 200 });
    }
  }
};
