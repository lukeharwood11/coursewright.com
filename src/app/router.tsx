import { Navigate, Route, Routes } from "react-router-dom";
import { AccountSettingsPage, LoginPage, SignupPage } from "@/auth";
import { RedirectIfAuthed, RequireAuth } from "@/app/gates/RequireAuth";
import { RequireStaff } from "@/app/gates/RequireStaff";
import { AccountLayout } from "@/app/layouts/AccountLayout";
import { OrgLayout } from "@/app/layouts/OrgLayout";
import { StubPage } from "@/app/StubPage";
import { CourseListPage, CoursePage } from "@/courses";
import {
  AboutPage,
  ConstructionPage,
  HomePage,
  LogosPage,
  MarketingLayout,
  PricingPage,
} from "@/marketing";
import { OrgHomePage, OrgPickerPage, OrgSettingsPage } from "@/organizations";
import {
  FamiliesPage,
  FamilyPage,
  OrgRosterPage,
  StudentProfilePage,
} from "@/roster";

/**
 * Thin route table. Domain screens live under src/<domain>/<page>/.
 * Paths: docs/URLS.md
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/logos" element={<LogosPage />} />
        <Route path="/contact" element={<ConstructionPage />} />
        <Route path="/privacy" element={<ConstructionPage />} />
        <Route path="/terms" element={<ConstructionPage />} />
        <Route path="/cookies" element={<ConstructionPage />} />
      </Route>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<AccountLayout />}>
          <Route path="/my" element={<OrgPickerPage />} />
          <Route path="/my/settings" element={<AccountSettingsPage />} />
        </Route>
        <Route path="/my/:orgSlug" element={<OrgLayout />}>
          <Route index element={<OrgHomePage />} />
          <Route path="settings" element={<OrgSettingsPage />} />
          <Route
            path="courses"
            element={
              <RequireStaff>
                <CourseListPage />
              </RequireStaff>
            }
          />
          <Route path="courses/:courseId" element={<CoursePage />} />
          <Route
            path="roster"
            element={
              <RequireStaff>
                <OrgRosterPage />
              </RequireStaff>
            }
          />
          <Route
            path="roster/:studentId"
            element={
              <RequireStaff>
                <StudentProfilePage />
              </RequireStaff>
            }
          />
          <Route
            path="families"
            element={
              <RequireStaff>
                <FamiliesPage />
              </RequireStaff>
            }
          />
          <Route
            path="families/:familyId"
            element={
              <RequireStaff>
                <FamilyPage />
              </RequireStaff>
            }
          />
        </Route>
      </Route>
      <Route path="/app" element={<Navigate to="/my" replace />} />
      <Route path="/app/parent" element={<Navigate to="/my" replace />} />
      <Route path="/app/courses" element={<Navigate to="/my" replace />} />
      <Route path="*" element={<StubPage title="Not found" domain="app" />} />
    </Routes>
  );
}
