export function BudgetsPage(): JSX.Element {
  return (
    <article id="panel-budgets" role="tabpanel" aria-labelledby="tab-budgets" className="page">
      <header className="page__header">
        <h2 className="page__title">Monthly budgets</h2>
        <p className="page__subtitle">Adjust limits, carry over what’s left, and keep status badges calm.</p>
      </header>
      <div className="page__content">
        <p className="page__placeholder">
          Budget controls live here. Wire up category grids, carry-over toggles, and badge indicators in Stage 3.
        </p>
      </div>
    </article>
  );
}
