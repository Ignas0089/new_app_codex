# Data Model

## Entities
- Category { id, name, color?, isActive }
- Budget { id, categoryId, month(YYYY-MM), amountEUR, carryOver? }
- Expense { id, date, amountEUR, categoryId, note }

## Derived
Actual(category, month) = sum(expenses in month & category)
Status = Actual / Budget
