import { Head, Html, Main, NextScript } from "next/document";

/**
 * Legacy Pages Router Document.
 *
 * Even though this app uses the App Router (`src/app/**`), some build/runtime
 * environments can still attempt to resolve `/_document`. Providing this shim
 * prevents `PageNotFoundError: Cannot find module for page: /_document`.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
