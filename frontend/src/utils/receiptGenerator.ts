import { formatNaira } from './formatters';

export interface ReceiptData {
  reference: string;
  amount_ngn: number;
  channel?: string;
  date?: string;
  customerName?: string;
  customerEmail?: string;
  status?: string;
}

export function downloadPdfReceipt(data: ReceiptData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download your receipt.');
    return;
  }

  const dateStr = data.date || new Date().toUTCString();
  const formattedAmount = formatNaira(data.amount_ngn);
  const statusStr = (data.status || 'SUCCESS').toUpperCase();

  const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Indunix AI Receipt - ${data.reference}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #047857;
    }
    .brand p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #64748B;
    }
    .receipt-title {
      text-align: right;
    }
    .receipt-title h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-title p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #64748B;
      font-family: monospace;
    }
    .grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .col h3 {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748B;
      margin: 0 0 6px;
      letter-spacing: 0.5px;
    }
    .col p {
      margin: 2px 0;
      font-weight: 600;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .table th {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      border-bottom: 1px solid #E2E8F0;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-align: left;
      text-transform: uppercase;
    }
    .table td {
      padding: 14px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .summary-box {
      width: 260px;
      font-size: 13px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #F1F5F9;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 2px solid #0F172A;
      font-size: 16px;
      font-weight: 800;
      color: #047857;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.6;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
    .print-bar {
      background: #047857;
      color: #FFFFFF;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -24px -24px 24px -24px;
      font-size: 13px;
    }
    .print-btn {
      background: #FFFFFF;
      color: #047857;
      border: none;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>Official Electronic Tax Invoice / Receipt</span>
    <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
  </div>

  <div class="header">
    <div class="brand">
      <h1>INDUNIX.AI</h1>
      <p>Sovereign AI Infrastructure • Esam Creative Technologies</p>
      <p>Lagos, Nigeria • api.indunixai.com</p>
    </div>
    <div class="receipt-title">
      <h2>Transaction Receipt</h2>
      <p>REF: ${data.reference}</p>
      <p style="margin-top: 4px;"><span class="badge">${statusStr}</span></p>
    </div>
  </div>

  <div class="grid">
    <div class="col">
      <h3>Billed To</h3>
      <p>${data.customerName || 'Indunix Developer'}</p>
      <p style="font-weight: normal; color: #475569;">${data.customerEmail || 'Customer'}</p>
    </div>
    <div class="col" style="text-align: right;">
      <h3>Payment Details</h3>
      <p style="font-weight: normal;">Date: ${dateStr}</p>
      <p style="font-weight: normal;">Method: Paystack Settlement (${data.channel || 'Direct NGN'})</p>
      <p style="font-weight: normal;">Currency: NGN (Nigerian Naira)</p>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Category</th>
        <th style="text-align: right;">Amount (NGN)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Indunix AI API Credits</strong><br />
          <span style="font-size: 11px; color: #64748B;">Prepaid inference wallet deposit</span>
        </td>
        <td>Cloud Compute & LLM Gateway</td>
        <td style="text-align: right; font-weight: 700;">${formattedAmount}</td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-box">
      <div class="summary-row">
        <span style="color: #64748B;">Subtotal:</span>
        <span>${formattedAmount}</span>
      </div>
      <div class="summary-row">
        <span style="color: #64748B;">VAT (0% Digital Exports):</span>
        <span>₦0.00</span>
      </div>
      <div class="summary-total">
        <span>Total Paid:</span>
        <span>${formattedAmount}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated computer-generated electronic receipt issued by Indunix AI.<br />
    Native Nigerian Naira settlements settled via Paystack Payment Gateway with zero foreign exchange fees.</p>
    <p>&copy; ${new Date().getFullYear()} Indunix AI. All rights reserved.</p>
  </div>

  <script>
    // Automatically trigger print dialog when opened
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}
