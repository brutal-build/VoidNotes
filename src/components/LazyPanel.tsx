import React, { Suspense, ComponentType } from "react";
import ErrorBoundary from "./ErrorBoundary";

function LazyFallback() {
  return <div className="lazy-loading">Loading...</div>;
}

interface LazyPanelProps {
  name: string;
  component: ComponentType<any>;
  componentProps?: Record<string, any>;
}

export default function LazyPanel({ name, component: Component, componentProps = {} }: LazyPanelProps) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <ErrorBoundary name={name}>
        <Component {...componentProps} />
      </ErrorBoundary>
    </Suspense>
  );
}
