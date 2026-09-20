export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: number
          invited_by: string
          membership_id: number | null
          organization_id: number
          role: string
          student_profile_id: number | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: number
          invited_by: string
          membership_id?: number | null
          organization_id: number
          role?: string
          student_profile_id?: number | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: number
          invited_by?: string
          membership_id?: number | null
          organization_id?: number
          role?: string
          student_profile_id?: number | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invites_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invites_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invite_students: {
        Row: {
          created_at: string
          id: number
          invite_id: number
          student_profile_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          invite_id: number
          student_profile_id: number
        }
        Update: {
          created_at?: string
          id?: number
          invite_id?: number
          student_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_invite_students_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "admin_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invite_students_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: number
          id: number
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: number
          id?: number
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: number
          id?: number
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string
          body: string
          class_ids: number[]
          course_ids: number[]
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          end_date: string | null
          id: number
          organization_id: number
          start_date: string | null
          student_profile_ids: number[]
          title: string
          updated_at: string
        }
        Insert: {
          audience: string
          body?: string
          class_ids?: number[]
          course_ids?: number[]
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          id?: number
          organization_id: number
          start_date?: string | null
          student_profile_ids?: number[]
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          class_ids?: number[]
          course_ids?: number[]
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string | null
          id?: number
          organization_id?: number
          start_date?: string | null
          student_profile_ids?: number[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          body: Json
          copied_from_id: number | null
          created_at: string
          deleted_at: string | null
          file_id: number | null
          id: number
          kind: string
          material_id: number
          position: number
          updated_at: string
        }
        Insert: {
          body?: Json
          copied_from_id?: number | null
          created_at?: string
          deleted_at?: string | null
          file_id?: number | null
          id?: number
          kind: string
          material_id: number
          position?: number
          updated_at?: string
        }
        Update: {
          body?: Json
          copied_from_id?: number | null
          created_at?: string
          deleted_at?: string | null
          file_id?: number | null
          id?: number
          kind?: string
          material_id?: number
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_copied_from_id_fkey"
            columns: ["copied_from_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      class_leaders: {
        Row: {
          class_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          class_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          class_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_leaders_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: number
          created_at: string
          id: number
          student_profile_id: number
        }
        Insert: {
          class_id: number
          created_at?: string
          id?: number
          student_profile_id: number
        }
        Update: {
          class_id?: number
          created_at?: string
          id?: number
          student_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          id: number
          organization_id: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: number
          organization_id: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: number
          organization_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          course_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          course_id: number
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          course_id?: number
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_templates: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string
          grade_levels: string[]
          id: number
          organization_id: number
          search_vector: unknown
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string
          grade_levels?: string[]
          id?: number
          organization_id: number
          search_vector?: unknown
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string
          grade_levels?: string[]
          id?: number
          organization_id?: number
          search_vector?: unknown
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color_key: string
          copied_from_course_id: number | null
          created_at: string
          description: string
          end_date: string | null
          grade_levels: string[]
          icon_key: string | null
          id: number
          location: string
          organization_id: number
          search_vector: unknown
          start_date: string | null
          status: string
          subject: string
          template_id: number | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          color_key?: string
          copied_from_course_id?: number | null
          created_at?: string
          description?: string
          end_date?: string | null
          grade_levels?: string[]
          icon_key?: string | null
          id?: number
          location?: string
          organization_id: number
          search_vector?: unknown
          start_date?: string | null
          status?: string
          subject?: string
          template_id?: number | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          color_key?: string
          copied_from_course_id?: number | null
          created_at?: string
          description?: string
          end_date?: string | null
          grade_levels?: string[]
          icon_key?: string | null
          id?: number
          location?: string
          organization_id?: number
          search_vector?: unknown
          start_date?: string | null
          status?: string
          subject?: string
          template_id?: number | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_copied_from_course_id_fkey"
            columns: ["copied_from_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_message_attachments: {
        Row: {
          created_at: string
          file_id: number | null
          id: number
          kind: string
          label: string
          material_id: number | null
          message_id: number
          position: number
          url: string | null
        }
        Insert: {
          created_at?: string
          file_id?: number | null
          id?: number
          kind: string
          label?: string
          material_id?: number | null
          message_id: number
          position?: number
          url?: string | null
        }
        Update: {
          created_at?: string
          file_id?: number | null
          id?: number
          kind?: string
          label?: string
          material_id?: number | null
          message_id?: number
          position?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_message_attachments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_message_attachments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "discussion_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_message_mentions: {
        Row: {
          created_at: string
          id: number
          message_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "discussion_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_message_mentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          discussion_id: number
          id: number
          parent_id: number | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          discussion_id: number
          id?: number
          parent_id?: number | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          discussion_id?: number
          id?: number
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_messages_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussion_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_reads: {
        Row: {
          discussion_id: number
          id: number
          last_read_at: string
          user_id: string
        }
        Insert: {
          discussion_id: number
          id?: number
          last_read_at?: string
          user_id: string
        }
        Update: {
          discussion_id?: number
          id?: number
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_reads_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          answered_at: string | null
          answered_by: string | null
          audience: string
          class_id: number | null
          course_id: number | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: number
          last_message_at: string
          notify_all: boolean
          organization_id: number
          title: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          answered_by?: string | null
          audience: string
          class_id?: number | null
          course_id?: number | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          last_message_at?: string
          notify_all?: boolean
          organization_id: number
          title: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          answered_by?: string | null
          audience?: string
          class_id?: number | null
          course_id?: number | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          last_message_at?: string
          notify_all?: boolean
          organization_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: number
          enrolled_at: string
          id: number
          status: string
          student_profile_id: number
        }
        Insert: {
          course_id: number
          enrolled_at?: string
          id?: number
          status?: string
          student_profile_id: number
        }
        Update: {
          course_id?: number
          enrolled_at?: string
          id?: number
          status?: string
          student_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: number
          organization_id: number
          search_vector: unknown
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: number
          organization_id: number
          search_vector?: unknown
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: number
          organization_id?: number
          search_vector?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          display_name: string
          family_id: number
          id: number
          parent_user_id: string | null
          student_profile_id: number | null
        }
        Insert: {
          created_at?: string
          display_name: string
          family_id: number
          id?: number
          parent_user_id?: string | null
          student_profile_id?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string
          family_id?: number
          id?: number
          parent_user_id?: string | null
          student_profile_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          email: string
          id: number
          message: string
          name: string
          org_name: string | null
          org_slug: string | null
          organization_id: number | null
          page_path: string | null
          role: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          message: string
          name: string
          org_name?: string | null
          org_slug?: string | null
          organization_id?: number | null
          page_path?: string | null
          role?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          message?: string
          name?: string
          org_name?: string | null
          org_slug?: string | null
          organization_id?: number | null
          page_path?: string | null
          role?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          file_id: number
          filename: string
          id: number
          mime_type: string
          size_bytes: number
          storage_ref: string
          version: number
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          file_id: number
          filename: string
          id?: number
          mime_type: string
          size_bytes: number
          storage_ref: string
          version: number
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          file_id?: number
          filename?: string
          id?: number
          mime_type?: string
          size_bytes?: number
          storage_ref?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          current_version: number
          deleted_at: string | null
          filename: string
          id: number
          mime_type: string
          organization_id: number
          search_vector: unknown
          size_bytes: number
          storage_ref: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          current_version?: number
          deleted_at?: string | null
          filename: string
          id?: number
          mime_type: string
          organization_id: number
          search_vector?: unknown
          size_bytes?: number
          storage_ref: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          current_version?: number
          deleted_at?: string | null
          filename?: string
          id?: number
          mime_type?: string
          organization_id?: number
          search_vector?: unknown
          size_bytes?: number
          storage_ref?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      important_now: {
        Row: {
          course_id: number
          created_at: string
          created_by: string
          id: number
          material_id: number
          organization_id: number
        }
        Insert: {
          course_id: number
          created_at?: string
          created_by: string
          id?: number
          material_id: number
          organization_id: number
        }
        Update: {
          course_id?: number
          created_at?: string
          created_by?: string
          id?: number
          material_id?: number
          organization_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "important_now_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "important_now_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "important_now_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "important_now_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_day_materials: {
        Row: {
          created_at: string
          id: number
          lesson_plan_day_id: number
          material_id: number
          position: number
        }
        Insert: {
          created_at?: string
          id?: number
          lesson_plan_day_id: number
          material_id: number
          position?: number
        }
        Update: {
          created_at?: string
          id?: number
          lesson_plan_day_id?: number
          material_id?: number
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_day_materials_lesson_plan_day_id_fkey"
            columns: ["lesson_plan_day_id"]
            isOneToOne: false
            referencedRelation: "lesson_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_day_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_days: {
        Row: {
          body: string
          created_at: string
          day_date: string
          id: number
          lesson_plan_id: number
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          day_date: string
          id?: number
          lesson_plan_id: number
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          day_date?: string
          id?: number
          lesson_plan_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_days_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          course_id: number
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: number
          organization_id: number
          title: string
          updated_at: string
          visibility: string
          week_note: string
          week_start: string
        }
        Insert: {
          course_id: number
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          organization_id: number
          title: string
          updated_at?: string
          visibility?: string
          week_note?: string
          week_start: string
        }
        Update: {
          course_id?: number
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          organization_id?: number
          title?: string
          updated_at?: string
          visibility?: string
          week_note?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_versions: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          id: number
          material_id: number
          snapshot: Json
          version: number
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          id?: number
          material_id: number
          snapshot: Json
          version: number
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: number
          material_id?: number
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_versions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          copied_from_id: number | null
          course_id: number | null
          created_at: string
          current_version: number
          deleted_at: string | null
          deleted_by: string | null
          deprecated_at: string | null
          deprecated_by: string | null
          description: string
          due_date: string | null
          file_id: number | null
          id: number
          is_overridden: boolean
          kind: string
          organization_id: number
          position: number
          promoted_to_id: number | null
          scheduled_date: string | null
          search_vector: unknown
          status: string
          template_id: number | null
          title: string
          unit_id: number | null
          updated_at: string
          url: string | null
          visibility: string
        }
        Insert: {
          copied_from_id?: number | null
          course_id?: number | null
          created_at?: string
          current_version?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deprecated_at?: string | null
          deprecated_by?: string | null
          description?: string
          due_date?: string | null
          file_id?: number | null
          id?: number
          is_overridden?: boolean
          kind: string
          organization_id: number
          position?: number
          promoted_to_id?: number | null
          scheduled_date?: string | null
          search_vector?: unknown
          status?: string
          template_id?: number | null
          title: string
          unit_id?: number | null
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Update: {
          copied_from_id?: number | null
          course_id?: number | null
          created_at?: string
          current_version?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deprecated_at?: string | null
          deprecated_by?: string | null
          description?: string
          due_date?: string | null
          file_id?: number | null
          id?: number
          is_overridden?: boolean
          kind?: string
          organization_id?: number
          position?: number
          promoted_to_id?: number | null
          scheduled_date?: string | null
          search_vector?: unknown
          status?: string
          template_id?: number | null
          title?: string
          unit_id?: number | null
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_copied_from_id_fkey"
            columns: ["copied_from_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_deprecated_by_fkey"
            columns: ["deprecated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_promoted_to_id_fkey"
            columns: ["promoted_to_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: number
          organization_id: number
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          organization_id: number
          role: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          organization_id?: number
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          audience_label: string
          created_at: string
          discussion_id: number | null
          discussion_message_id: number | null
          id: number
          kind: string
          organization_id: number
          preview: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          audience_label?: string
          created_at?: string
          discussion_id?: number | null
          discussion_message_id?: number | null
          id?: number
          kind: string
          organization_id: number
          preview?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          audience_label?: string
          created_at?: string
          discussion_id?: number | null
          discussion_message_id?: number | null
          id?: number
          kind?: string
          organization_id?: number
          preview?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_discussion_message_id_fkey"
            columns: ["discussion_message_id"]
            isOneToOne: false
            referencedRelation: "discussion_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          grade_labels: string[]
          grade_scheme: string
          id: number
          name: string
          org_type: string
          search_vector: unknown
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_labels: string[]
          grade_scheme: string
          id?: number
          name: string
          org_type: string
          search_vector?: unknown
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_labels?: string[]
          grade_scheme?: string
          id?: number
          name?: string
          org_type?: string
          search_vector?: unknown
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: number
          parent_user_id: string
          student_profile_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          parent_user_id: string
          student_profile_id: number
        }
        Update: {
          created_at?: string
          id?: number
          parent_user_id?: string
          student_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          google_id: string | null
          id: string
          name: string
          search_vector: unknown
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          google_id?: string | null
          id: string
          name?: string
          search_vector?: unknown
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          google_id?: string | null
          id?: string
          name?: string
          search_vector?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          course_id: number | null
          created_at: string
          expires_at: string | null
          id: number
          link_type: string
          material_id: number | null
          organization_id: number
          parent_invite_id: number | null
          student_profile_id: number | null
          token: string
        }
        Insert: {
          course_id?: number | null
          created_at?: string
          expires_at?: string | null
          id?: number
          link_type: string
          material_id?: number | null
          organization_id: number
          parent_invite_id?: number | null
          student_profile_id?: number | null
          token?: string
        }
        Update: {
          course_id?: number | null
          created_at?: string
          expires_at?: string | null
          id?: number
          link_type?: string
          material_id?: number | null
          organization_id?: number
          parent_invite_id?: number | null
          student_profile_id?: number | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_parent_invite_id_fkey"
            columns: ["parent_invite_id"]
            isOneToOne: false
            referencedRelation: "admin_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          created_at: string
          created_via_course_id: number | null
          grade_level: string | null
          id: number
          name: string
          organization_id: number
          parent_email: string | null
          search_vector: unknown
          student_email: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_via_course_id?: number | null
          grade_level?: string | null
          id?: number
          name: string
          organization_id: number
          parent_email?: string | null
          search_vector?: unknown
          student_email?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_via_course_id?: number | null
          grade_level?: string | null
          id?: number
          name?: string
          organization_id?: number
          parent_email?: string | null
          search_vector?: unknown
          student_email?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_created_via_course_id_fkey"
            columns: ["created_via_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_access: {
        Row: {
          created_at: string
          id: number
          permission: string
          template_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          permission: string
          template_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          permission?: string
          template_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_access_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          copied_from_id: number | null
          course_id: number | null
          created_at: string
          deleted_at: string | null
          deprecated_at: string | null
          end_date: string | null
          id: number
          is_overridden: boolean
          organization_id: number
          position: number
          search_vector: unknown
          start_date: string | null
          template_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          copied_from_id?: number | null
          course_id?: number | null
          created_at?: string
          deleted_at?: string | null
          deprecated_at?: string | null
          end_date?: string | null
          id?: number
          is_overridden?: boolean
          organization_id: number
          position?: number
          search_vector?: unknown
          start_date?: string | null
          template_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          copied_from_id?: number | null
          course_id?: number | null
          created_at?: string
          deleted_at?: string | null
          deprecated_at?: string | null
          end_date?: string | null
          id?: number
          is_overridden?: boolean
          organization_id?: number
          position?: number
          search_vector?: unknown
          start_date?: string | null
          template_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_copied_from_id_fkey"
            columns: ["copied_from_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "course_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_invite: { Args: { p_token: string }; Returns: string }
      claim_staff_invite: { Args: { p_token: string }; Returns: string }
      get_org_person_profile: {
        Args: { p_organization_id: number; p_user_id: string }
        Returns: {
          courses: Json
          leads: Json
          name: string
          role: string
          teaches: Json
          user_id: string
        }[]
      }
      get_invite: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          email: string
          email_matches: boolean
          id: number
          organization_id: number
          organization_name: string
          organization_slug: string
          role: string
          student_name: string
          student_profile_id: number
        }[]
      }
      get_staff_invite: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          email: string
          email_matches: boolean
          id: number
          organization_id: number
          organization_name: string
          organization_slug: string
          role: string
          student_name: string
          student_profile_id: number
        }[]
      }
      list_discussion_audience_members: {
        Args: {
          p_audience: string
          p_class_id: number | null
          p_course_id: number | null
          p_organization_id: number
        }
        Returns: {
          name: string
          role: string
          user_id: string
        }[]
      }
      list_discussion_members: {
        Args: { p_discussion_id: number }
        Returns: {
          name: string
          role: string
          user_id: string
        }[]
      }
      save_material_page: {
        Args: { p_blocks?: Json; p_material_id: number; p_placement?: Json }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
