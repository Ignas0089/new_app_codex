import type { PropsWithChildren } from 'react';

export function Layout({ children }: PropsWithChildren): JSX.Element {
  return (
    <div className="layout">
      <main className="layout__main" role="main">
        {children}
      </main>
    </div>
  );
}
