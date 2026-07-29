/**
 * Merge Client Master + POC Master into a review workbook/HTML.
 * Does NOT write to the database.
 *
 * Usage: node scripts/merge-client-poc-review.mjs
 */
const ExcelJS = require("exceljs")
const fs = require("fs")
const path = require("path")

const CLIENT_FILE = "/Users/aryanprajapati/Downloads/Sheets/CLient Master.xlsx"
const POC_FILE = "/Users/aryanprajapati/Downloads/Sheets/POC Master.xlsx"
const OUT_DIR = path.join(process.cwd(), "outputs/customer_import_review")
const OUT_XLSX = path.join(OUT_DIR, "Customer_Import_Review.xlsx")
const OUT_XLSX_DOWNLOADS = "/Users/aryanprajapati/Downloads/Sheets/Customer_Import_Review.xlsx"

function cellVal(v) {
  if (v == null || v === undefined) return ""
  if (v instanceof Date) {
    const y = v.getFullYear()
    const m = String(v.getMonth() + 1).padStart(2, "0")
    const d = String(v.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    // Excel often stores phones as numbers
    if (Number.isInteger(v) || Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v))
    return String(v)
  }
  if (typeof v === "object") {
    if (v.text != null) return String(v.text).trim()
    if (v.result != null) return cellVal(v.result)
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("").trim()
    if (v.hyperlink && v.text) return String(v.text).trim()
    // ExcelJS sometimes wraps primitives
    if ("sharedFormula" in v || "formula" in v) return cellVal(v.result)
  }
  const s = String(v).trim()
  if (s === "[object Object]") return ""
  return s
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normEmail(e) {
  const s = String(e || "")
    .trim()
    .toLowerCase()
  if (!s || !s.includes("@") || s === "null" || s === "n/a" || s === "-" || s === "[object object]")
    return ""
  return s
}

function normPhone(p) {
  const s = cellVal(p)
  if (!s) return ""
  // keep digits / + only for readability
  const cleaned = s.replace(/[^\d+]/g, "")
  return cleaned || s
}

function isPrimaryDesig(d) {
  return /^primary\s*poc/i.test(d)
}
function isCollectionDesig(d) {
  return /collection\s*poc/i.test(d)
}
function isReportDesig(d) {
  return /report/i.test(d)
}
function primaryRank(d) {
  const m = String(d).match(/primary\s*poc\s*(\d+)/i)
  return m ? Number(m[1]) : 1
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const clientWb = new ExcelJS.Workbook()
  await clientWb.xlsx.readFile(CLIENT_FILE)
  const cws = clientWb.worksheets[0]

  const headerMap = {}
  cws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const h = cellVal(cell.value)
    if (h) headerMap[h] = colNumber
  })
  const col = (name) => headerMap[name]

  const clients = new Map()
  cws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return
    const id = cellVal(row.getCell(col("S") || 1).value)
    if (!id || !/^BI/i.test(id)) return
    clients.set(id, {
      customerId: id,
      brandName: cellVal(row.getCell(col("Customer Brand Name")).value),
      tradeName: cellVal(row.getCell(col("Customer Trade Name")).value),
      city: cellVal(row.getCell(col("City")).value),
      state: cellVal(row.getCell(col("State")).value),
      lsuName: cellVal(row.getCell(col("LSU Name")).value),
      lsuTechnicianName: cellVal(row.getCell(col("LSU Technician Name")).value),
      operationsIncharge: cellVal(row.getCell(col("Operations Incharge")).value),
      serviceStartDate: cellVal(row.getCell(col("Service Start Date")).value),
      collectionFrequency: cellVal(row.getCell(col("Collection Frequency")).value),
      noOfKiosk: cellVal(row.getCell(col("No Of Kiosks")).value),
    })
  })

  const pocWb = new ExcelJS.Workbook()
  await pocWb.xlsx.readFile(POC_FILE)
  const mi = pocWb.getWorksheet("Master_Imported")
  if (mi) {
    mi.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return
      const id = cellVal(row.getCell(1).value)
      if (!clients.has(id)) return
      const tech = cellVal(row.getCell(8).value)
      if (tech) clients.get(id).lsuTechnicianName = tech
      const lsu = cellVal(row.getCell(7).value)
      if (lsu && !clients.get(id).lsuName) clients.get(id).lsuName = lsu
      const ops = cellVal(row.getCell(10).value)
      if (ops && !clients.get(id).operationsIncharge) clients.get(id).operationsIncharge = ops
    })
  }

  const pocTable = pocWb.getWorksheet("POC_Table")
  const pocsByCustomer = new Map()
  let skippedNoEmail = 0
  pocTable.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return
    const id = cellVal(row.getCell(1).value)
    if (!id) return
    const name = cellVal(row.getCell(2).value)
    const email = normEmail(cellVal(row.getCell(3).value))
    const mobile = normPhone(row.getCell(4).value)
    const designation = cellVal(row.getCell(5).value)
    const status = cellVal(row.getCell(6).value)
    if (!pocsByCustomer.has(id)) pocsByCustomer.set(id, [])
    if (!email) {
      skippedNoEmail++
      pocsByCustomer.get(id).push({
        name,
        email: "",
        mobile,
        designation,
        status,
        skipped: true,
      })
      return
    }
    pocsByCustomer.get(id).push({ name, email, mobile, designation, status, skipped: false })
  })

  const ready = []
  const skippedCustomers = []
  const needsReview = []

  for (const [id, client] of clients) {
    if (!pocsByCustomer.has(id)) {
      skippedCustomers.push({
        ...client,
        reason: "Customer ID not present in POC Master (POC_Table)",
      })
      continue
    }

    const allPocs = pocsByCustomer.get(id)
    const valid = allPocs.filter((p) => !p.skipped)

    const primaries = valid
      .filter((p) => isPrimaryDesig(p.designation))
      .sort((a, b) => primaryRank(a.designation) - primaryRank(b.designation))
    const collections = valid.filter((p) => isCollectionDesig(p.designation))
    const reports = valid.filter((p) => isReportDesig(p.designation))

    let primary = null
    const collectionPocs = []
    if (primaries.length >= 1) {
      primary = primaries[0]
      for (let i = 1; i < primaries.length; i++) {
        collectionPocs.push({
          ...primaries[i],
          note: "Moved from Primary POC 2+ into Collection POC list",
        })
      }
    }
    for (const p of collections) collectionPocs.push({ ...p, note: "Collection POC" })
    for (const p of reports) {
      collectionPocs.push({ ...p, note: "Report POC added into Collection POC list" })
    }

    const seen = new Set()
    const deduped = []
    for (const p of collectionPocs) {
      const key = p.email.toLowerCase()
      if (primary && key === primary.email.toLowerCase()) continue
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(p)
    }

    const skippedPocs = allPocs.filter((p) => p.skipped)
    const row = {
      ...client,
      primaryPocName: primary?.name || "",
      primaryPocEmail: primary?.email || "",
      primaryPocNumber: primary?.mobile || "",
      primaryPocDesignation: primary?.designation || "",
      collectionPocs: deduped.map((p) => ({
        name: p.name,
        email: p.email,
        number: p.mobile,
        designation: p.designation,
        note: p.note,
      })),
      collectionPocCount: deduped.length,
      skippedPocCount: skippedPocs.length,
      skippedPocsDetail: skippedPocs
        .map(
          (p) =>
            `${p.name || "(no name)"} / ${p.designation || "?"} / ${p.mobile || "no mobile"} (no email)`,
        )
        .join(" | "),
      flags: [],
    }

    if (!row.primaryPocEmail) row.flags.push("MISSING_PRIMARY_POC_EMAIL")
    if (!row.brandName) row.flags.push("MISSING_BRAND")
    if (!row.lsuTechnicianName) row.flags.push("MISSING_LSU_TECHNICIAN")
    if (!row.collectionFrequency) row.flags.push("MISSING_COLLECTION_FREQUENCY")
    if (row.flags.length) needsReview.push(row)
    ready.push(row)
  }

  const out = new ExcelJS.Workbook()
  out.creator = "BuffIndia Import Review"

  // Expand N collection/report POCs into N column groups so every email is visible in Excel
  const maxCollectionPocs = ready.reduce((m, r) => Math.max(m, r.collectionPocs.length), 0)

  const baseHeaders = [
    "Customer ID",
    "Customer Brand Name",
    "Customer Trade Name",
    "State",
    "City",
    "LSU Name",
    "LSU Technician Name",
    "Operations Incharge",
    "Service Start Date",
    "Collection Frequency",
    "No. Of Kiosk",
    "Primary POC Name",
    "Primary POC Email",
    "Primary POC Number",
    "Primary POC Designation",
    "Collection POC Count",
  ]

  const pocSlotHeaders = []
  for (let i = 1; i <= maxCollectionPocs; i++) {
    pocSlotHeaders.push(
      `Collection POC ${i} Name`,
      `Collection POC ${i} Email`,
      `Collection POC ${i} Number`,
      `Collection POC ${i} Type`, // original designation: Collection / Report / Primary 2+
    )
  }

  const trailHeaders = ["Skipped POCs (no email)", "Flags / Review Notes"]
  const readyHeaders = [...baseHeaders, ...pocSlotHeaders, ...trailHeaders]

  function readyRowValues(r) {
    const vals = [
      r.customerId,
      r.brandName,
      r.tradeName,
      r.state,
      r.city,
      r.lsuName,
      r.lsuTechnicianName,
      r.operationsIncharge,
      r.serviceStartDate,
      r.collectionFrequency,
      r.noOfKiosk,
      r.primaryPocName,
      r.primaryPocEmail,
      r.primaryPocNumber,
      r.primaryPocDesignation,
      r.collectionPocCount,
    ]
    for (let i = 0; i < maxCollectionPocs; i++) {
      const p = r.collectionPocs[i]
      if (p) {
        vals.push(p.name, p.email, p.number, p.designation || p.note || "")
      } else {
        vals.push("", "", "", "")
      }
    }
    vals.push(r.skippedPocsDetail, r.flags.join("; "))
    return vals
  }

  const readySheet = out.addWorksheet("Ready_For_Import")
  readySheet.addRow(readyHeaders)
  readySheet.getRow(1).font = { bold: true }
  readySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC6EFCE" },
  }
  for (const r of ready) {
    readySheet.addRow(readyRowValues(r))
  }
  readySheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }]

  // One row per POC (easier to filter/search emails like Abhijay)
  const collSheet = out.addWorksheet("All_POCs_One_Per_Row")
  collSheet.addRow([
    "Customer ID",
    "Brand",
    "POC Role",
    "POC Slot #",
    "Name",
    "Email",
    "Number",
    "Source Designation",
    "Note",
  ])
  collSheet.getRow(1).font = { bold: true }
  for (const r of ready) {
    if (r.primaryPocEmail) {
      collSheet.addRow([
        r.customerId,
        r.brandName,
        "Primary",
        1,
        r.primaryPocName,
        r.primaryPocEmail,
        r.primaryPocNumber,
        r.primaryPocDesignation,
        "Primary POC",
      ])
    }
    r.collectionPocs.forEach((p, i) => {
      const role = isReportDesig(p.designation)
        ? "Report (in Collection list)"
        : isPrimaryDesig(p.designation)
          ? "Extra Primary (in Collection list)"
          : "Collection"
      collSheet.addRow([
        r.customerId,
        r.brandName,
        role,
        i + 1,
        p.name,
        p.email,
        p.number,
        p.designation,
        p.note,
      ])
    })
  }

  const skipSheet = out.addWorksheet("Skipped_Not_In_POC_Master")
  skipSheet.addRow([
    "Customer ID",
    "Customer Brand Name",
    "Customer Trade Name",
    "City",
    "State",
    "Reason",
  ])
  skipSheet.getRow(1).font = { bold: true }
  skipSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC7CE" },
  }
  for (const r of skippedCustomers) {
    skipSheet.addRow([r.customerId, r.brandName, r.tradeName, r.city, r.state, r.reason])
  }

  const reviewSheet = out.addWorksheet("Needs_Review_Flags")
  reviewSheet.addRow(readyHeaders)
  reviewSheet.getRow(1).font = { bold: true }
  reviewSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFEB9C" },
  }
  for (const r of needsReview) {
    reviewSheet.addRow(readyRowValues(r))
  }

  const summary = out.addWorksheet("Summary")
  summary.addRow(["Metric", "Count"])
  summary.getRow(1).font = { bold: true }
  summary.addRow(["Client Master customers", clients.size])
  summary.addRow(["Included (also in POC Master)", ready.length])
  summary.addRow(["Skipped — not in POC Master", skippedCustomers.length])
  summary.addRow(["Included but need review (flags)", needsReview.length])
  summary.addRow(["POC rows skipped (no email)", skippedNoEmail])
  summary.addRow([
    "Total collection POC entries after merge",
    ready.reduce((s, r) => s + r.collectionPocCount, 0),
  ])
  summary.addRow([])
  summary.addRow(["Rules", ""])
  summary.addRow(["1", "Only customers in BOTH Client Master and POC Master"])
  summary.addRow(["2", "POC without email excluded"])
  summary.addRow(["3", "Primary POC 1 = Primary; Primary POC 2+ → Collection list"])
  summary.addRow(["4", "All Collection POCs in Collection list"])
  summary.addRow(["5", "All Report POCs added into Collection list"])
  summary.addRow(["6", "Accounts/Purchase/Group/Left ignored"])
  summary.addRow(["7", "NOT written to database"])

  await out.xlsx.writeFile(OUT_XLSX)
  try {
    await out.xlsx.writeFile(OUT_XLSX_DOWNLOADS)
  } catch (e) {
    console.warn("Could not write to Downloads/Sheets:", e.message)
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      clientMasterCount: clients.size,
      included: ready.length,
      skippedNotInPocMaster: skippedCustomers.length,
      needsReview: needsReview.length,
      pocRowsSkippedNoEmail: skippedNoEmail,
    },
    ready,
    skippedCustomers,
  }
  fs.writeFileSync(path.join(OUT_DIR, "merged_review.json"), JSON.stringify(payload, null, 2))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Customer Import Review</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;background:#F7F6F2;margin:0;color:#141414}
  header{background:linear-gradient(135deg,#0F1F14,#1B7339);color:#fff;padding:28px 32px}
  header h1{margin:0 0 8px;font-size:28px;font-weight:600}
  .wrap{padding:24px 32px 48px;max-width:1400px;margin:0 auto}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
  .card{background:#fff;border:1px solid #E5E5E5;border-radius:14px;padding:16px}
  .card b{display:block;font-size:24px;color:#1B7339}
  .card span{font-size:12px;color:#666}
  .note{background:#E8F5E9;border:1px solid #C8E6D4;border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:14px}
  input{width:100%;max-width:360px;padding:10px 12px;border-radius:10px;border:1px solid #D0D0D0;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;background:#fff;font-size:12.5px}
  th{background:#E8F5E9;text-align:left;padding:10px 8px;position:sticky;top:0}
  td{padding:8px;border-top:1px solid #EEE;vertical-align:top}
  .flag{color:#B45309;font-weight:600}
  .muted{color:#888}
</style>
</head>
<body>
<header>
  <h1>Customer Import Review</h1>
  <p>Merged Client Master + POC Master — review only, not imported to database.</p>
</header>
<div class="wrap">
  <div class="cards">
    <div class="card"><b>${payload.summary.included}</b><span>Ready (in both sheets)</span></div>
    <div class="card"><b>${payload.summary.skippedNotInPocMaster}</b><span>Skipped (not in POC Master)</span></div>
    <div class="card"><b>${payload.summary.needsReview}</b><span>Need review (flags)</span></div>
    <div class="card"><b>${payload.summary.pocRowsSkippedNoEmail}</b><span>POC rows dropped (no email)</span></div>
  </div>
  <div class="note">
    <strong>Excel file:</strong> <code>${escapeHtml(OUT_XLSX)}</code><br/>
    Also try: <code>${escapeHtml(OUT_XLSX_DOWNLOADS)}</code>
  </div>
  <input id="q" placeholder="Filter by Customer ID or brand..." />
  <div style="overflow:auto;max-height:70vh;border:1px solid #E5E5E5;border-radius:12px">
  <table id="t">
    <thead><tr>
      <th>ID</th><th>Brand</th><th>City / State</th><th>LSU / Tech</th>
      <th>Start / Freq / Kiosks</th><th>Primary POC</th><th>Collection POCs</th><th>Flags</th>
    </tr></thead>
    <tbody>
${ready
  .map((r) => {
    const coll = r.collectionPocs
      .map(
        (p, i) =>
          `<div><strong>${i + 1}.</strong> ${escapeHtml(p.name)} &lt;${escapeHtml(p.email)}&gt; · ${escapeHtml(p.designation || "")}</div>`,
      )
      .join("")
    return `<tr data-q="${escapeHtml((r.customerId + " " + r.brandName).toLowerCase())}">
      <td><strong>${escapeHtml(r.customerId)}</strong></td>
      <td>${escapeHtml(r.brandName)}<div class="muted">${escapeHtml(r.tradeName)}</div></td>
      <td>${escapeHtml(r.city)}, ${escapeHtml(r.state)}</td>
      <td>${escapeHtml(r.lsuName)}<div class="muted">${escapeHtml(r.lsuTechnicianName)}</div><div class="muted">Ops: ${escapeHtml(r.operationsIncharge)}</div></td>
      <td>${escapeHtml(r.serviceStartDate)}<div class="muted">${escapeHtml(r.collectionFrequency)} · ${escapeHtml(String(r.noOfKiosk))} kiosks</div></td>
      <td>${escapeHtml(r.primaryPocName)}<div class="muted">${escapeHtml(r.primaryPocEmail)}</div><div class="muted">${escapeHtml(String(r.primaryPocNumber))}</div></td>
      <td>${coll || '<span class="muted">None</span>'}${
        r.skippedPocCount
          ? `<details><summary class="muted">${r.skippedPocCount} POC(s) skipped (no email)</summary><code>${escapeHtml(r.skippedPocsDetail)}</code></details>`
          : ""
      }</td>
      <td class="flag">${escapeHtml(r.flags.join(", "))}</td>
    </tr>`
  })
  .join("\n")}
    </tbody>
  </table>
  </div>

  <h2 style="margin-top:32px">Skipped — not in POC Master (${skippedCustomers.length})</h2>
  <div style="overflow:auto;max-height:40vh;border:1px solid #E5E5E5;border-radius:12px">
  <table>
    <thead><tr><th>ID</th><th>Brand</th><th>City</th><th>State</th><th>Reason</th></tr></thead>
    <tbody>
${skippedCustomers
  .map(
    (r) =>
      `<tr><td>${escapeHtml(r.customerId)}</td><td>${escapeHtml(r.brandName)}</td><td>${escapeHtml(r.city)}</td><td>${escapeHtml(r.state)}</td><td>${escapeHtml(r.reason)}</td></tr>`,
  )
  .join("\n")}
    </tbody>
  </table>
  </div>
</div>
<script>
document.getElementById('q').addEventListener('input', (e) => {
  const v = e.target.value.trim().toLowerCase();
  document.querySelectorAll('#t tbody tr').forEach(tr => {
    tr.style.display = !v || tr.dataset.q.includes(v) ? '' : 'none';
  });
});
</script>
</body>
</html>`

  fs.writeFileSync(path.join(OUT_DIR, "preview.html"), html)

  console.log(
    JSON.stringify(
      {
        excel: OUT_XLSX,
        downloadsCopy: OUT_XLSX_DOWNLOADS,
        html: path.join(OUT_DIR, "preview.html"),
        json: path.join(OUT_DIR, "merged_review.json"),
        summary: payload.summary,
        sampleBI001: ready.find((r) => r.customerId === "BI001"),
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
