import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { CustomerDoc, RawInvoice } from "@/lib/types";
import { buildLedger, type LedgerEntry } from "@/lib/ledger";
import { formatDate } from "@/lib/invoice-utils";

// Register bundled Roboto fonts (Roboto supports the ₹ glyph).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).addVirtualFileSystem(pdfFonts);

function fmt(n: number): string {
  if (!n) return "";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function money(n: number): string {
  return `₹ ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`;
}

function entryRow(e: LedgerEntry): Content[] {
  return [
    { text: formatDate(e.date), style: "cell" },
    { text: e.particulars, style: "cell" },
    { text: fmt(e.debit), style: "cellRight" },
    { text: fmt(e.credit), style: "cellRight" },
    { text: money(e.balance), style: "cellRight" },
  ];
}

export async function downloadCustomerLedgerPdf(
  customer: CustomerDoc,
  invoices: RawInvoice[],
): Promise<void> {
  const ledger = buildLedger(customer, invoices);
  const { company } = ledger;

  const generatedOn = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const header: Content[] = [
    {
      columns: [
        [
          { text: company.name || "", style: "companyName" },
          company.address ? { text: company.address, style: "companyMeta" } : { text: "" },
          company.gstin
            ? { text: `GSTIN: ${company.gstin}`, style: "companyMeta" }
            : { text: "" },
        ],
        [
          { text: "ACCOUNT LEDGER", style: "docTitle", alignment: "right" },
          {
            text: `Period: 01 Apr 2026 – Present`,
            style: "companyMeta",
            alignment: "right",
          },
          {
            text: `Generated: ${generatedOn}`,
            style: "companyMeta",
            alignment: "right",
          },
        ],
      ],
    },
    { canvas: [{ type: "line", x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1, lineColor: "#0f172a" }], margin: [0, 6, 0, 8] },
  ];

  const partyBlock: Content = {
    style: "party",
    table: {
      widths: ["*", "*"],
      body: [
        [
          [
            { text: "Party", style: "label" },
            { text: customer.details.name || "—", style: "value" },
            customer.details.address
              ? { text: customer.details.address, style: "meta" }
              : { text: "" },
            { text: `GSTIN: ${customer.details.gstin}`, style: "meta" },
          ],
          [
            { text: "Summary", style: "label", alignment: "right" },
            {
              text: `Total Business: ${money(ledger.totalBusiness)}`,
              style: "meta",
              alignment: "right",
            },
            {
              text: `Total Received: ${money(ledger.totalCredit)}`,
              style: "meta",
              alignment: "right",
            },
            {
              text: `Outstanding: ${money(ledger.outstanding)}`,
              style: "summaryEmph",
              alignment: "right",
            },
          ],
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 12] as [number, number, number, number],
  };

  const tableBody: Content[][] = [
    [
      { text: "Date", style: "th" },
      { text: "Particulars", style: "th" },
      { text: "Debit (₹)", style: "th", alignment: "right" },
      { text: "Credit (₹)", style: "th", alignment: "right" },
      { text: "Running Balance", style: "th", alignment: "right" },
    ],
  ];

  if (ledger.entries.length === 0) {
    tableBody.push(([
      {
        text: "No transactions on or after 1 April 2026.",
        colSpan: 5,
        alignment: "center",
        style: "cell",
        margin: [0, 8, 0, 8],
      },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "" },
    ]) as unknown as Content[]);
  } else {
    for (const e of ledger.entries) tableBody.push(entryRow(e));
    tableBody.push(([
      { text: "Totals", style: "totalLabel", colSpan: 2 },
      { text: "" },
      { text: fmt(ledger.totalDebit), style: "totalCell", alignment: "right" },
      { text: fmt(ledger.totalCredit), style: "totalCell", alignment: "right" },
      { text: money(ledger.outstanding), style: "totalCell", alignment: "right" },
    ]) as unknown as Content[]);
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#0f172a" },
    header: () => ({ text: "", margin: [40, 20, 40, 0] }),
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "This is a computer-generated ledger.", style: "footer" },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: "right",
          style: "footer",
        },
      ],
      margin: [40, 15, 40, 0],
    }),
    content: [
      ...header,
      partyBlock,
      {
        table: {
          headerRows: 1,
          widths: [70, "*", 70, 70, 90],
          body: tableBody,
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
          vLineWidth: () => 0,
          hLineColor: (i: number) => (i <= 1 ? "#0f172a" : "#e2e8f0"),
          fillColor: (rowIndex: number) =>
            rowIndex === 0
              ? "#0f172a"
              : rowIndex % 2 === 0
                ? "#f8fafc"
                : null,
        },
      },
    ],
    styles: {
      companyName: { fontSize: 14, bold: true, color: "#0f172a" },
      companyMeta: { fontSize: 9, color: "#475569" },
      docTitle: { fontSize: 13, bold: true, color: "#0f172a", margin: [0, 2, 0, 4] },
      label: {
        fontSize: 8,
        bold: true,
        color: "#64748b",
        characterSpacing: 1,
      },
      value: { fontSize: 11, bold: true, color: "#0f172a", margin: [0, 2, 0, 2] },
      meta: { fontSize: 9, color: "#475569" },
      summaryEmph: { fontSize: 11, bold: true, color: "#0f172a", margin: [0, 4, 0, 0] },
      party: {},
      th: { color: "#ffffff", bold: true, fontSize: 9, margin: [0, 4, 0, 4] },
      cell: { fontSize: 9, margin: [0, 3, 0, 3] },
      cellRight: { fontSize: 9, margin: [0, 3, 0, 3], alignment: "right" },
      totalLabel: { bold: true, fontSize: 10, margin: [0, 4, 0, 4] },
      totalCell: { bold: true, fontSize: 10, margin: [0, 4, 0, 4] },
      footer: { fontSize: 8, color: "#94a3b8" },
    },
  };

  const safeName = (customer.details.name || customer.details.gstin)
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  const filename = `Ledger_${safeName || customer.details.gstin}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}