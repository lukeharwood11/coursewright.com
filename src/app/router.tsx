import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AccountSettingsPage, LoginPage, SignupPage } from "@/auth";
import { RedirectIfAuthed, RequireAuth } from "@/app/gates/RequireAuth";
import { RequireOrgFeature } from "@/app/gates/RequireOrgFeature";
import { RequireStaff } from "@/app/gates/RequireStaff";
import { AccountLayout } from "@/app/layouts/AccountLayout";
import { OrgChrome } from "@/app/layouts/OrgChrome";
import { OrgLayout } from "@/app/layouts/OrgLayout";
import { PrintLayout } from "@/app/layouts/PrintLayout";
import { StubPage } from "@/app/StubPage";
import { CourseListPage, CoursePage, CourseRosterPage, CourseSettingsPage } from "@/courses";
import { CourseGradebookPage, ProgressPage, ReportCardPage } from "@/grading";
import { CalendarPage } from "@/calendar";
import { EventEditPage, EventPage } from "@/events";
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
import { QuizEditPage, QuizPage } from "@/quizzes";
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
function RosterStudentRedirect() {
  const { studentId } = useParams();
  return <Navigate to={`../students/${studentId ?? ""}`} replace />;
}

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
            <Route path="courses" element={<CourseListPage />} />
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
              path="courses/:courseId/gradebook"
              element={
                <RequireStaff>
                  <CourseGradebookPage />
                </RequireStaff>
              }
            />
            <Route
              path="calendar"
              element={
                <RequireOrgFeature feature="calendar">
                  <CalendarPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="events/new"
              element={
                <RequireOrgFeature feature="events">
                  <RequireStaff>
                    <EventEditPage />
                  </RequireStaff>
                </RequireOrgFeature>
              }
            />
            <Route
              path="events/:eventId"
              element={
                <RequireOrgFeature feature="events">
                  <EventPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="events/:eventId/edit"
              element={
                <RequireOrgFeature feature="events">
                  <RequireStaff>
                    <EventEditPage />
                  </RequireStaff>
                </RequireOrgFeature>
              }
            />
            <Route
              element={
                <RequireOrgFeature feature="resources">
                  <ResourcesLayout />
                </RequireOrgFeature>
              }
            >
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
            <Route
              path="announcements"
              element={
                <RequireOrgFeature feature="announcements">
                  <AnnouncementsPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="announcements/new"
              element={
                <RequireOrgFeature feature="announcements">
                  <RequireStaff>
                    <AnnouncementEditPage />
                  </RequireStaff>
                </RequireOrgFeature>
              }
            />
            <Route
              path="announcements/:announcementId"
              element={
                <RequireOrgFeature feature="announcements">
                  <AnnouncementPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="announcements/:announcementId/edit"
              element={
                <RequireOrgFeature feature="announcements">
                  <RequireStaff>
                    <AnnouncementEditPage />
                  </RequireStaff>
                </RequireOrgFeature>
              }
            />
            <Route
              path="discussions"
              element={
                <RequireOrgFeature feature="discussions">
                  <DiscussionsPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="discussions/new"
              element={
                <RequireOrgFeature feature="discussions">
                  <DiscussionNewPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="discussions/:discussionId"
              element={
                <RequireOrgFeature feature="discussions">
                  <DiscussionPage />
                </RequireOrgFeature>
              }
            />
            <Route path="activity" element={<ActivityPage />} />
            <Route
              path="courses/:courseId/lesson-plans/new"
              element={
                <RequireOrgFeature feature="lessonPlans">
                  <RequireStaff>
                    <LessonPlanEditPage />
                  </RequireStaff>
                </RequireOrgFeature>
              }
            />
            <Route
              path="courses/:courseId/lesson-plans/:lessonPlanId"
              element={
                <RequireOrgFeature feature="lessonPlans">
                  <LessonPlanPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="courses/:courseId/lesson-plans/:lessonPlanId/edit"
              element={
                <RequireOrgFeature feature="lessonPlans">
                  <RequireStaff>
                    <LessonPlanEditPage />
                  </RequireStaff>
                </RequireOrgFeature>
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
              path="courses/:courseId/units/:unitId/quizzes/:quizId"
              element={<QuizPage />}
            />
            <Route
              path="courses/:courseId/units/:unitId/quizzes/:quizId/edit"
              element={
                <RequireStaff>
                  <QuizEditPage />
                </RequireStaff>
              }
            />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="students" element={<OrgRosterPage />} />
            <Route path="students/:studentId" element={<StudentProfilePage />} />
            <Route path="report-cards/:cardId" element={<ReportCardPage />} />
            <Route path="roster" element={<Navigate to="../students" replace />} />
            <Route path="roster/:studentId" element={<RosterStudentRedirect />} />
            <Route path="classes/:classId" element={<ClassRosterPage />} />
          </Route>
          <Route element={<PrintLayout />}>
            <Route path="print-this-week" element={<PrintPage />} />
            <Route
              path="events/:eventId/print"
              element={
                <RequireOrgFeature feature="events">
                  <PrintPage />
                </RequireOrgFeature>
              }
            />
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
            <Route
              path="courses/:courseId/units/:unitId/quizzes/:quizId/print"
              element={<PrintPage />}
            />
            <Route
              path="resources/print"
              element={
                <RequireOrgFeature feature="resources">
                  <PrintPage />
                </RequireOrgFeature>
              }
            />
            <Route
              path="resources/items/:itemId/print"
              element={
                <RequireOrgFeature feature="resources">
                  <PrintPage />
                </RequireOrgFeature>
              }
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
