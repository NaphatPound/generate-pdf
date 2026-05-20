import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 20mm; }
    body {
      font-family: 'Sarabun', 'TH Sarabun New', 'Segoe UI', Tahoma, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b7cff;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #3b7cff;
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0;
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      color: #1a2332;
      border-left: 4px solid #3b7cff;
      padding-left: 10px;
      margin: 0 0 10px;
      font-size: 16px;
    }
    .info-row {
      display: flex;
      margin-bottom: 6px;
    }
    .info-label {
      font-weight: 600;
      min-width: 150px;
      color: #555;
    }
    .info-value {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    table th {
      background: #3b7cff;
      color: white;
      padding: 8px 12px;
      text-align: left;
      font-size: 13px;
    }
    table td {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    table tr:nth-child(even) td {
      background: #f8f9fa;
    }
    .total-row td {
      font-weight: 600;
      border-top: 2px solid #333;
    }
    .footer {
      position: fixed;
      bottom: 0;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 10px;
      width: 100%;
    }
    .signature-area {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #333;
      padding-top: 5px;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{companyName}}</h1>
    <p>{{documentTitle}} - {{documentNumber}}</p>
  </div>

  <div class="section">
    <h2>Customer Information</h2>
    <div class="info-row">
      <span class="info-label">Customer Name:</span>
      <span class="info-value">{{customerName}}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address:</span>
      <span class="info-value">{{customerAddress}}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">{{customerPhone}}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">{{customerEmail}}</span>
    </div>
  </div>

  <div class="section">
    <h2>Order Details</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>{{itemDescription}}</td>
          <td>{{itemQuantity}}</td>
          <td>{{itemUnitPrice}}</td>
          <td>{{itemTotal}}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="4" style="text-align:right">Total Amount:</td>
          <td>{{totalAmount}}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="section">
    <h2>Terms & Conditions</h2>
    <p>{{termsConditions}}</p>
  </div>

  <div class="section">
    <h2>Notes</h2>
    <p>{{notes}}</p>
  </div>

  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">_________________________</div>
      <div>{{issuerName}}</div>
      <div style="font-size:12px;color:#666;">Issuer</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">_________________________</div>
      <div>{{customerName}}</div>
      <div style="font-size:12px;color:#666;">Customer</div>
    </div>
  </div>

  <div class="footer">
    {{footerText}}
  </div>
</body>
</html>`

const sampleVariables = [
  { name: 'companyName', label: 'Company Name', type: 'text', defaultValue: 'Acme Corporation' },
  { name: 'documentTitle', label: 'Document Title', type: 'text', defaultValue: 'Invoice' },
  { name: 'documentNumber', label: 'Document Number', type: 'text', defaultValue: 'INV-2024-0001' },
  { name: 'customerName', label: 'Customer Name', type: 'text', defaultValue: 'John Doe' },
  { name: 'customerAddress', label: 'Customer Address', type: 'text', defaultValue: '123 Main Street, City' },
  { name: 'customerPhone', label: 'Customer Phone', type: 'text', defaultValue: '+1 555-0123' },
  { name: 'customerEmail', label: 'Customer Email', type: 'text', defaultValue: 'john@example.com' },
  { name: 'itemDescription', label: 'Item Description', type: 'text', defaultValue: 'Consulting Services' },
  { name: 'itemQuantity', label: 'Item Quantity', type: 'text', defaultValue: '10' },
  { name: 'itemUnitPrice', label: 'Unit Price', type: 'text', defaultValue: '500.00' },
  { name: 'itemTotal', label: 'Item Total', type: 'text', defaultValue: '5,000.00' },
  { name: 'totalAmount', label: 'Total Amount', type: 'text', defaultValue: '5,000.00' },
  { name: 'termsConditions', label: 'Terms & Conditions', type: 'textarea', defaultValue: 'Payment is due within 30 days.' },
  { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: 'Thank you for your business!' },
  { name: 'issuerName', label: 'Issuer Name', type: 'text', defaultValue: 'Jane Smith' },
  { name: 'footerText', label: 'Footer Text', type: 'text', defaultValue: 'Thank you for choosing Acme Corporation' },
]

async function main() {
  console.log('Seeding database...')

  await prisma.pdfTemplate.create({
    data: {
      name: 'Invoice Template',
      description: 'Standard invoice template with customer info, order details, and signature area',
      content: sampleContent,
      variables: JSON.stringify(sampleVariables),
    },
  })

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
