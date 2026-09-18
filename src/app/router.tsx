import { Navigate, Route, Routes } from "react-router-dom";
import { AccountSettingsPage, LoginPage, SignupPage } from "@/auth";
import { RedirectIfAuthed, RequireAuth } from "@/app/gates/RequireAuth";
import { RequireStaff } from "@/app/gates/RequireStaff";
import { AccountLayout } from "@/app/layouts/AccountLayout";
import { OrgChrome } from "@/app/layouts/OrgChrome";
import { OrgLayout } from "@/app/layouts/OrgLayout";
import { PrintLayout } from "@/app/layouts/PrintLayout";
import { StubPage } from "@/app/StubPage";
import { CourseListPage, CoursePage, CourseRosterPage, CourseSettingsPage } from "@/courses";
import { MaterialEditPage, MaterialPage } from "@/materials";
import {
  AboutPage,
  ConstructionPage,
  HomePage,
  LogosPage,
  MarketingLayout,
  PricingPage,
} from "@/marketing";
import {
  ClaimInvitePage,
  OrgHomePage,
  OrgPickerPage,
  OrgSettingsPage,
} from "@/organizations";
import { PrintPage } from "@/print";
import {
  ClassRosterPage,
  OrgRosterPage,
  StudentProfilePage,
} from "@/roster";
import { UnitPage } from "@/units";

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
        <Route path="/invite/:token" element={<ClaimInvitePage />} />
        <Route element={<AccountLayout />}>
          <Route path="/my" element={<OrgPickerPage />} />
          <Route path="/my/settings" element={<AccountSettingsPage />} />
        </Route>
        <Route path="/my/:orgSlug" element={<OrgLayout />}>
          <Route element={<OrgChrome />}>
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
              path="courses/:courseId/settings"
              element={
                <RequireStaff>
                  <CourseSettingsPage />
                </RequireStaff>
              }
            />
            <Route
              path="courses/:courseId/roster"
              element={
                <RequireStaff>
                  <CourseRosterPage />
                </RequireStaff>
              }
            />
            <Route
              path="courses/:courseId/units/:unitId"
              element={<UnitPage />}
            />
            <Route
              path="courses/:courseId/materials/:materialId"
              element={<MaterialPage />}
            />
            <Route
              path="courses/:courseId/materials/:materialId/edit"
              element={<MaterialEditPage />}
            />
            <Route
              path="courses/:courseId/units/:unitId/materials/:materialId"
              element={<MaterialPage />}
            />
            <Route
              path="courses/:courseId/units/:unitId/materials/:materialId/edit"
              element={<MaterialEditPage />}
            />
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
              path="classes/:classId"
              element={
                <RequireStaff>
                  <ClassRosterPage />
                </RequireStaff>
              }
            />
          </Route>
          <Route element={<PrintLayout />}>
            <Route path="print-this-week" element={<PrintPage />} />
            <Route
              path="courses/:courseId/materials/:materialId/print"
              element={<PrintPage />}
            />
            <Route
              path="courses/:courseId/units/:unitId/print"
              element={<PrintPage />}
            />
            <Route
              path="courses/:courseId/units/:unitId/materials/:materialId/print"
              element={<PrintPage />}
            />
          </Route>
        </Route>
      </Route>
      <Route path="/app" element={<Navigate to="/my" replace />} />
      <Route path="/app/parent" element={<Navigate to="/my" replace />} />
      <Route path="/app/courses" element={<Navigate to="/my" replace />} />
      <Route path="*" element={<StubPage title="Not found" domain="app" />} />
    </Routes>
  );
}
