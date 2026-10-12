import SwaggerPageClient from "./SwaggerPageClient";

// 5.0.4 AT3 exempt: this is the Swagger reference for developers, not an app page, so it has no
// user menu or sign-out control.
export default function ApiDocsPage() {
  return <SwaggerPageClient />;
}