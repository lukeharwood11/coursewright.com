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
import { CalendarPage } from "@/calendar";
import { FeedbackPage } from "@/feedback";
import {
  AnnouncementEditPage,
  AnnouncementPage,
  AnnouncementsPage,
} from "@/announcements";
import {
  DiscussionNewPage,
  DiscussionPage,
  DiscussionsPage,
} from "@/discussions";
import { ActivityPage } from "@/notifications";
import { LessonPlanEditPage, LessonPlanPage } from "@/lesson-plans";
import { MaterialEditPage, MaterialPage } from "@/materials";
import {
  AboutPage,
  ContactPage,
  CookiesPage,
  DocsHomePage,
  DocsLayout,
  DocsTopicPage,
  HomePage,
  LogosPage,
  MarketingLayout,
  PricingPage,
  PrivacyPage,
  TermsPage,
} from "@/marketing";
import {
  ClaimInvitePage,
  OrgHomePage,
  OrgPickerPage,
  OrgSettingsPage,
  UserProfilePage,
} from "@/organizations";
import { PrintPage } from "@/print";
import {
  ResourceEditPage,
  ResourceFolderPage,
  ResourcePage,
  ResourcesLayout,
  ResourcesPage,
} from "@/resources";
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
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<DocsHomePage />} />
          <Route path=":slug" element={<DocsTopicPage />} />
        </Route>
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
      <Route path="/invite/:token" element={<ClaimInvitePage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AccountLayout />}>
          <Route path="/my" element={<OrgPickerPage />} />
          <Route path="/my/settings" element={<AccountSettingsPage />} />
          <Route path="/my/feedback" element={<FeedbackPage />} />
        </Route>
        <Route path="/my/:orgSlug" element={<OrgLayout />}>
          <Route element={<OrgChrome />}>
            <Route index element={<OrgHomePage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route
              path="settings"
              element={
                <RequireStaff>
                  <OrgSettingsPage />
                </RequireStaff>
              }
            />
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
            <Route path="calendar" element={<CalendarPage />} />
            <Route element={<ResourcesLayout />}>
              <Route path="resources" element={<ResourcesPage />} />
              <Route
                path="resources/folders/:folderId"
                element={<ResourceFolderPage />}
              />
              <Route path="resources/items/:itemId" element={<ResourcePage />} />
              <Route
                path="resources/items/:itemId/edit"
                element={<ResourceEditPage />}
              />
            </Route>
            <Route path="people/:userId" element={<UserProfilePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route
              path="announcements/new"
              element={
                <RequireStaff>
                  <AnnouncementEditPage />
                </RequireStaff>
              }
            />
            <Route
              path="announcements/:announcementId"
              element={<AnnouncementPage />}
            />
            <Route
              path="announcements/:announcementId/edit"
              element={
                <RequireStaff>
                  <AnnouncementEditPage />
                </RequireStaff>
              }
            />
            <Route path="discussions" element={<DiscussionsPage />} />
            <Route path="discussions/new" element={<DiscussionNewPage />} />
            <Route
              path="discussions/:discussionId"
              element={<DiscussionPage />}
            />
            <Route path="activity" element={<ActivityPage />} />
            <Route
              path="courses/:courseId/lesson-plans/new"
              element={
                <RequireStaff>
                  <LessonPlanEditPage />
                </RequireStaff>
              }
            />
            <Route
              path="courses/:courseId/lesson-plans/:lessonPlanId"
              element={<LessonPlanPage />}
            />
            <Route
              path="courses/:courseId/lesson-plans/:lessonPlanId/edit"
              element={
                <RequireStaff>
                  <LessonPlanEditPage />
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
            <Route path="resources/print" element={<PrintPage />} />
            <Route
              path="resources/items/:itemId/print"
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
