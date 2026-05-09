import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import AlignmentTest from "./AlignmentTest.jsx";
import ReuploadPage from "./ReuploadPage.jsx";
import OfferPage from "./OfferPage.jsx";

const path = window.location.pathname;

let Page;
if (path === "/admin") {
  Page = AdminDashboard;
} else if (path === "/alignment-test") {
  Page = AlignmentTest;
} else if (path === "/reupload") {
  Page = ReuploadPage;
} else if (path === "/offer") {
  Page = OfferPage;
} else {
  Page = App;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
