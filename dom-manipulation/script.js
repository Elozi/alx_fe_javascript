/******************************************************************************
*  Dynamic Quote Generator – Tasks 2 & 3 (filter, storage, sync)
******************************************************************************/

// -------------------------  CONFIG  ----------------------------------------
const BACKEND_URL = "https://jsonplaceholder.typicode.com/posts/1"; // mock
const SYNC_INTERVAL = 30_000; // 30 s
// ---------------------------------------------------------------------------

let quotes = [];
const LS_QUOTES_KEY   = "quotes";
const LS_FILTER_KEY   = "lastFilter";
const SS_LAST_QUOTE   = "lastQuoteHTML";

/* --------------------  helpers -------------------- */
const $ = (id) => document.getElementById(id);
const saveQuotes = () => localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
const uniq = (arr) => [...new Set(arr)];

/* --------------------  INIT ----------------------- */
window.onload = () => {
  // Load quotes or seed defaults
  quotes = JSON.parse(localStorage.getItem(LS_QUOTES_KEY) || "[]");
  if (quotes.length === 0) {
    quotes = [
      { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
      { text: "Life is what happens when you're busy making other plans.",           category: "Life"       },
      { text: "Do or do not. There is no try.",                                      category: "Inspiration"}
    ];
    saveQuotes();
  }

  populateCategories();                      // dropdown
  $("categoryFilter").value = localStorage.getItem(LS_FILTER_KEY) || "all";
  filterQuotes();                            // show initial list / quote
  restoreLastQuote();                        // from sessionStorage
  startSyncLoop();                           // periodic server sync
};

/* --------------------  CATEGORY FILTERING  -------------------- */
function populateCategories() {
  const sel = $("categoryFilter");
  sel.innerHTML = '<option value="all">All Categories</option>'; // reset
  uniq(quotes.map((q) => q.category)).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function filterQuotes() {
  const cat = $("categoryFilter").value;
  localStorage.setItem(LS_FILTER_KEY, cat);

  if (cat === "all") {
    $("quoteDisplay").textContent = "Press “Show New Quote”.";
    return;
  }

  const first = quotes.find((q) => q.category === cat);
  if (first) {
    $("quoteDisplay").innerHTML = `<strong>${first.text}</strong><br/><em>(${first.category})</em>`;
    sessionStorage.setItem(SS_LAST_QUOTE, $("quoteDisplay").innerHTML);
  } else {
    $("quoteDisplay").textContent = "No quotes in this category yet.";
  }
}

/* --------------------  SHOW RANDOM -------------------- */
$("newQuote").addEventListener("click", () => {
  const cat = $("categoryFilter").value;
  const pool = cat === "all" ? quotes : quotes.filter((q) => q.category === cat);

  if (pool.length === 0) return alert("No quotes available.");

  const { text, category } = pool[Math.floor(Math.random() * pool.length)];
  const html = `<strong>${text}</strong><br/><em>(${category})</em>`;
  $("quoteDisplay").innerHTML = html;
  sessionStorage.setItem(SS_LAST_QUOTE, html);
});

/* --------------------  ADD QUOTE -------------------- */
function addQuote() {
  const text = $("newQuoteText").value.trim();
  const category = $("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Both fields required.");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  $("categoryFilter").value = category;   // auto‑select new cat
  filterQuotes();

  $("newQuoteText").value = $("newQuoteCategory").value = "";
}

/* --------------------  IMPORT / EXPORT -------------------- */
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "quotes.json"; document.body.append(a).click();
  a.remove(); URL.revokeObjectURL(url);
}

function importFromJsonFile(e) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      if (!Array.isArray(data)) throw Error();
      quotes.push(...data);
      saveQuotes();
      populateCategories();
      alert("Quotes imported!");
    } catch { alert("Invalid JSON file."); }
  };
  reader.readAsText(e.target.files[0]);
}

/* --------------------  SESSION RESTORE -------------------- */
function restoreLastQuote() {
  const html = sessionStorage.getItem(SS_LAST_QUOTE);
  if (html) $("quoteDisplay").innerHTML = html;
}

/* --------------------  SERVER SYNC (Task 3) --------------- */
function startSyncLoop() {
  syncWithServer();                          // immediate
  setInterval(syncWithServer, SYNC_INTERVAL);// periodic
}

async function syncWithServer() {
  try {
    $("syncNotice").textContent = "⏳ Syncing…";
    // 1. Fetch server blob (mock)
    const res = await fetch(BACKEND_URL);
    const serverData = await res.json();
    const serverQuotes = JSON.parse(serverData.body || "[]");

    // 2. Simple conflict rule: server wins; merge uniques
    let merged = [...serverQuotes];
    quotes.forEach((q) => {
      if (!serverQuotes.some((sq) => sq.text === q.text && sq.category === q.category))
        merged.push(q);
    });

    // 3. If anything changed, save & POST back
    const changed = JSON.stringify(merged) !== JSON.stringify(serverQuotes);
    if (changed) {
      await fetch(BACKEND_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...serverData, body: JSON.stringify(merged) })
      });
    }

    quotes = merged;
    saveQuotes();
    populateCategories();
    $("syncNotice").textContent = "✅ Synced " + new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Sync failed:", err);
    $("syncNotice").textContent = "⚠️ Sync error";
  }
}
