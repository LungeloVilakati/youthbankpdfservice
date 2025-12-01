const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

// --- Paste your existing HTML template functions here ---

function payslipTemplate(data) {
  const { name, payPeriod, earnings, deductions } = data;

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPay = totalEarnings - totalDeductions;

  return `
  <html>
  <head>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;}
      .header{display:flex;justify-content:space-between;align-items:center;}
      .header img{width:140px;}
      h1{text-align:center;color:#042F2E;}
      table{width:100%;border-collapse:collapse;margin-top:20px;}
      th,td{border:1px solid #E5E7EB;padding:8px;text-align:left;}
      th{background:#f7faf7;color:#042F2E;}
      th:nth-child(2), td:nth-child(2) { text-align: right; } /* Align amounts to the right */
      th:first-child, td:first-child {width: 70%;} /* Fix column alignment */
      .notes { margin-top: 40px; font-size: 13px; color: #444; }
      .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="https://res.cloudinary.com/dgffufsnv/image/upload/v1763578822/youthbank_gfa2ch.png" />
      <div><strong>Youth Bank</strong><br>support@tyba.africa</div>
    </div>
    <h1>Payslip - ${payPeriod}</h1>
    <table>
      <tr><th>Learner's Name</th><td>${name}</td></tr> 
    </table>

    <h2>Earnings</h2>
    <table>
      <tr><th>Description</th><th>Amount (R)</th></tr>
      ${earnings.map(e => `<tr><td>${e.label}</td><td>${e.amount.toFixed(2)}</td></tr>`).join("")}
      <tr><th>Total Earnings</th><th>${totalEarnings.toFixed(2)}</th></tr>
    </table>

    <h2>Deductions</h2>
    <table>
      <tr><th>Description</th><th>Amount (R)</th></tr>
      ${deductions.map(d => `<tr><td>${d.label}</td><td>${d.amount.toFixed(2)}</td></tr>`).join("")}
      <tr><th>Total Deductions</th><th>${totalDeductions.toFixed(2)}</th></tr>
    </table>

    <table style="margin-top: 20px; border: none;">
        <tr>
            <th style="border: none; text-align: left; font-size: 18px;">NET PAY</th>
            <th style="border: none; text-align: right; font-size: 18px;">R ${netPay.toFixed(2)}</th>
        </tr>
    </table>


    <div class="notes">
        &bull; For disputes or queries, email <b>support@tyba.africa</b>.
    </div>
    <div class="footer">
        This payslip was generated electronically and does not require a signature.<br>
        &copy; ${new Date().getFullYear()} Youth Bank. All rights reserved.
    </div>
  </body>
  </html>`;
}

function statementTemplate(data) {
  const { userInfo, statementInfo, transactions, companyInfo } = data;

  // Calculations
  const totalFees = transactions
    .filter((t) => t.type_alias === "charge")
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
  const totalDeposits = transactions
    .filter((t) => t.class === "credit" && t.type_alias !== "charge")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalWithdrawals = transactions
    .filter((t) => t.class === "debit" && t.type_alias !== "charge")
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
  const closingBalance = data.closingBalance;
  const openingBalance = closingBalance + totalWithdrawals + totalFees - totalDeposits;

  const feeReferences = [
    "Notification - SMS - Consumer",
    "Payment - EFT Realtime",
    "Topup - Instant EFT",
    "Topup - Online Card",
    "Cashout - ATM",
    "Payment - EFT Standard",
    "Cashout - Retail"
  ];

  const transactionsHTML = transactions
    .map(t => {
      const isFee = feeReferences.includes(t.reference);
      const isCredit = t.class === "credit";
      const formattedAmount = Math.abs(parseFloat(t.amount)).toFixed(2);

      let amountCell = `<td style="text-align: right;">R 0.00</td>`;
      let feeCell = `<td style="text-align: right;">R 0.00</td>`;

      if (isFee) {
        feeCell = `<td style="text-align: right;">-R ${formattedAmount}</td>`;
      } else {
        amountCell = `<td style="text-align: right;">${isCredit ? "" : "-"}R ${formattedAmount}</td>`;
      }

      return `
        <tr>
            <td>${new Date(t.timestamp).toLocaleDateString()}</td>
            <td>${t.class.charAt(0).toUpperCase() + t.class.slice(1)}</td>
            <td>${t.reference}</td>
            ${amountCell}
            ${feeCell}
        </tr>
      `;
    }).join("");

  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #0A2A18; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .header img { width: 180px; }
        .company-info { text-align: right; font-size: 14px; line-height: 1.4; }
        h1 { text-align: center; margin-top: 40px; color: #0E3D26; font-size: 22px; letter-spacing: 0.5px; }
        .info-block { margin-top: 30px; font-size: 15px; line-height: 1.8; }
        .label { font-weight: bold; color: #0E3D26; }
        .summary-box { border: 1px solid #C7C7C7; padding: 18px; margin-top: 30px; background: #fafafa; font-size: 15px; width: 100%; box-sizing: border-box; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 35px; font-size: 14px; }
        table th { text-align: left; background: #f2f2f2; padding: 10px; border-bottom: 1px solid #ccc; color: #0E3D26; font-weight: bold; }
        table td { padding: 10px; border-bottom: 1px solid #eee; color: #222; }
        table tr:nth-child(even) { background: #f9f9f9; }
        .notes { margin-top: 40px; font-size: 13px; color: #444; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
        <div class="header">
            <img src="${companyInfo.logoUrl}" />
            <div class="company-info">
                ${companyInfo.companyEmail}<br>
                ${companyInfo.companyWebsite}
            </div>
        </div>
        <h1>ACCOUNT STATEMENT</h1>
        <div class="info-block">
            <div><span class="label">Account Holder:</span> ${userInfo.fullName}</div>
            <div><span class="label">Account Number:</span> ${userInfo.accountNumber}</div>
            <div><span class="label">Statement Period:</span> ${statementInfo.monthYear}</div>
            <div><span class="label">Generated On:</span> ${new Date().toISOString().slice(0, 10)}</div>
        </div>
        <div class="summary-box">
            <div class="summary-row"><span>Opening Balance:</span><span>R ${openingBalance.toFixed(2)}</span></div>
            <div class="summary-row"><span>Total Deposits:</span><span>R ${totalDeposits.toFixed(2)}</span></div>
            <div class="summary-row"><span>Total Withdrawals:</span><span>R ${totalWithdrawals.toFixed(2)}</span></div>
            <div class="summary-row"><span>Total Fees:</span><span>R ${totalFees.toFixed(2)}</span></div>
            <div class="summary-row"><span class="label">Closing Balance:</span><span class="label">R ${closingBalance.toFixed(2)}</span></div>
        </div>
        <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th style="text-align: right;">Amount (R)</th><th style="text-align: right;">Fee (R)</th></tr></thead><tbody>${transactionsHTML}</tbody></table>
        <div class="notes">
            &bull; For disputes or queries, email <b>${companyInfo.companyEmail}</b>.
        </div>
        <div class="footer">
            This statement was generated electronically and does not require a signature.<br>
            &copy; ${new Date().getFullYear()} ${companyInfo.companyName}. All rights reserved.
        </div>
    </body>
    </html>`;
}

// --- Main Handler Function ---

module.exports = async (req, res) => {
  // Basic security: Check for a secret key
  if (req.headers['x-secret-key'] !== process.env.SECRET_KEY) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const { templateName, data } = req.body;

    let templateFunction;
    if (templateName === 'payslip') {
      templateFunction = payslipTemplate;
    } else if (templateName === 'statement') {
      templateFunction = statementTemplate;
    } else {
      return res.status(400).json({ error: 'Invalid template name' });
    }

    const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
    const page = await browser.newPage();
    
    await page.setContent(templateFunction(data), { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" }});
    
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF.', details: error.message });
  }
};