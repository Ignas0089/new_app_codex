export function SettingsPage(): JSX.Element {
  return (
    <article id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" className="page">
      <header className="page__header">
        <h2 className="page__title">Settings</h2>
        <p className="page__subtitle">Keep data safe, tailor categories, and stay confident in your backups.</p>
      </header>
      <div className="page__content">
        <p className="page__placeholder">
          Data management tools go here. Stage 3 connects export/import flows, reset actions, and personalization options.
        </p>
      </div>
    </article>
  );
}
