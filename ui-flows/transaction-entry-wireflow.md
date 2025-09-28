# Wireflow: Transaction Capture

1. **Dashboard Quick Add**
   - Entry button opens side panel.
   - Prefills today's date and default account from `@services/preferences.getDefaults`.

2. **Transaction Details Panel**
   - Fields: Amount (numeric), Type (income/expense), Category (autocomplete), Account (select), Notes.
   - Autocomplete powered by `@services/categories.search`.
   - Validation: amount > 0, account required, category required for expenses.

3. **Attachment Upload (optional)**
   - Drag-and-drop zone, previews uploaded receipts.
   - Upload uses `@services/files.uploadReceipt`.
   - Progress bar reflects `uploadProgress` state.

4. **Review & Save**
   - Summary card with debits/credits preview.
   - Primary CTA: "Log transaction" -> `@services/transactions.create`.
   - Secondary CTA: "Schedule recurring" toggles recurrence section (future).

5. **Confirmation Toast**
   - Success toast with undo action (undo -> `@services/transactions.delete` within 10 seconds).
   - Side panel closes and dashboard list refreshes via `@services/transactions.list`.

## Error Handling
- Inline field errors for validation.
- API failure displays persistent banner with retry action.
