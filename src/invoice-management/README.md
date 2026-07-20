# Invoice Management module

Paste the entire contents of your existing Invoice Management System's `src/`
folder into this directory. Keep the same internal structure:

```
src/invoice-management/
  components/
  hooks/
  img/
  lib/
  pages/
  utils/
```

Then, instead of a single `InvoiceForm.tsx`, `utils/firebase.ts` and
`utils/pdfGenerator.ts`, provide one file per company (and per document type).
The integration layer auto-loads the correct triple based on the user's
selection — no imports need to be changed in this project's routing code.

## Naming convention

```
components/InvoiceForm{Company}{Suffix}.tsx
utils/firebase{Company}{Suffix}.ts
utils/pdfGenerator{Company}{Suffix}.ts
```

`{Company}` is one of:

| CompanyId       | Segment  |
| --------------- | -------- |
| `mohit`         | `Mohit`  |
| `decousttech`   | `Decoust`|
| `asg`           | `Asg`    |

`{Suffix}` is one of:

| Type       | Suffix |
| ---------- | ------ |
| Invoices   | (none) |
| PI         | `PI`   |
| PO         | `PO`   |

### Examples

```
components/InvoiceFormMohit.tsx        // Invoices + Mohit
components/InvoiceFormDecoust.tsx      // Invoices + Decoust
components/InvoiceFormAsg.tsx          // Invoices + ASG

components/InvoiceFormMohitPI.tsx      // PI       + Mohit
components/InvoiceFormAsgPO.tsx        // PO       + ASG

utils/firebaseMohit.ts                 // Firestore for Mohit invoices
utils/pdfGeneratorAsgPO.ts             // PDF renderer for ASG POs
```

Each `InvoiceForm*.tsx` **must** `export default` the React component.

## How the runtime picks files

`src/invoice-management/loaders.ts` uses `import.meta.glob` to scan the
`components/` and `utils/` folders at build time. When the user opens
`/invoice/<type>/<company>`, the router looks up the matching filename and
lazily imports it. Missing files show a friendly notice — no build failure.

Inside your `InvoiceForm*` component you can either:

1. Import the matching `firebase*` / `pdfGenerator*` file directly (simplest).
2. Or call `loadFirebase(type, company)` / `loadPdfGenerator(type, company)`
   from `@/invoice-management/loaders` to have the resolver pick them for
   you.

## Outstanding Management is untouched

The Outstanding Management System keeps its own Firebase implementation in
`src/lib/firebase.ts` and `src/services/*`. Do not import from
`src/invoice-management/` outside the invoice routes.