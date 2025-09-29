# TODO: Revert Expense Feature to Simple Version

## Backend Changes
- [x] Revert GET /api/expenses endpoint in backend/main.py to simple version without query parameters
- [x] Remove advanced filtering, sorting, and pagination logic

## Frontend Changes
- [x] Remove state variables for pagination, sorting, and filters from Expense.jsx
- [x] Remove UI elements: filter form, sortable table headers, pagination controls
- [x] Revert fetchExpenses function to simple GET request without query params
- [x] Simplify table rendering to display all data without pagination

## Testing
- [ ] Test backend API returns all expenses without parameters
- [ ] Test frontend displays all expenses in simple table
- [ ] Verify CRUD operations still function correctly
