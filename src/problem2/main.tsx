import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { store } from "@/app/store";
import { i18n } from "@/app/i18n";
import { App } from "@/App";
import "@/index.css";
import { startMockWorker } from "@/mocks/browser";

async function bootstrap() {
  if (import.meta.env.DEV) {
    await startMockWorker();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Provider>
    </React.StrictMode>,
  );
}

void bootstrap();
