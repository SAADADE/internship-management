-- internship_system.sql
-- Generated from Backend/report_generator/models.py
-- PostgreSQL schema script for pgAdmin ERD generation

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional: keep everything grouped
CREATE SCHEMA IF NOT EXISTS public;

-- Drop in dependency order for repeatable re-runs
DROP TABLE IF EXISTS public.report_generator_student_supervisors CASCADE;
DROP TABLE IF EXISTS public.report_generator_activitylog CASCADE;
DROP TABLE IF EXISTS public.report_generator_companyrequest CASCADE;
DROP TABLE IF EXISTS public.report_generator_internshipreportdraft CASCADE;
DROP TABLE IF EXISTS public.report_generator_appraisal CASCADE;
DROP TABLE IF EXISTS public.report_generator_review CASCADE;
DROP TABLE IF EXISTS public.report_generator_report CASCADE;
DROP TABLE IF EXISTS public.report_generator_log CASCADE;
DROP TABLE IF EXISTS public.report_generator_internship CASCADE;
DROP TABLE IF EXISTS public.report_generator_company CASCADE;
DROP TABLE IF EXISTS public.report_generator_student CASCADE;
DROP TABLE IF EXISTS public.report_generator_supervisor CASCADE;

DROP TYPE IF EXISTS public.company_request_status CASCADE;
DROP TYPE IF EXISTS public.internship_status CASCADE;
DROP TYPE IF EXISTS public.log_status CASCADE;
DROP TYPE IF EXISTS public.report_status CASCADE;
DROP TYPE IF EXISTS public.review_decision CASCADE;

CREATE TYPE public.company_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.internship_status AS ENUM ('pending', 'active', 'completed', 'rejected');
CREATE TYPE public.log_status AS ENUM ('draft', 'submitted', 'reviewed', 'needs_revision');
CREATE TYPE public.report_status AS ENUM ('generating', 'ready', 'graded');
CREATE TYPE public.review_decision AS ENUM ('approved', 'rejected');

-- NOTE:
-- This schema assumes Django's default auth table exists as public.auth_user(id).
-- If your auth user table differs, adjust FK targets below.

CREATE TABLE public.report_generator_supervisor (
    supervisor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id integer UNIQUE NULL,
    fullname varchar(150) NOT NULL,
    password_hash text NOT NULL DEFAULT '',
    email varchar(254) UNIQUE NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_supervisor_user
        FOREIGN KEY (user_id)
        REFERENCES public.auth_user (id)
        ON DELETE CASCADE
);

CREATE TABLE public.report_generator_student (
    student_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id integer UNIQUE NULL,
    sch_email varchar(254) NOT NULL UNIQUE,
    index_number varchar(50) NOT NULL UNIQUE,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    faculty varchar(150) NOT NULL DEFAULT '',
    department varchar(150) NOT NULL DEFAULT '',
    programme varchar(150) NOT NULL DEFAULT '',
    level varchar(10) NOT NULL DEFAULT '',
    institution_name varchar(255) NOT NULL DEFAULT '',
    phone_number varchar(50) NOT NULL DEFAULT '',
    password_hash text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES public.auth_user (id)
        ON DELETE CASCADE
);

CREATE TABLE public.report_generator_company (
    company_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL UNIQUE,
    location varchar(255) NOT NULL DEFAULT 'Kumasi',
    created_by_id integer NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_company_created_by
        FOREIGN KEY (created_by_id)
        REFERENCES public.auth_user (id)
        ON DELETE SET NULL
);

CREATE TABLE public.report_generator_internship (
    internship_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name varchar(200) NOT NULL,
    company_address text NOT NULL DEFAULT '',
    internship_position varchar(150) NOT NULL,
    internship_supervisor varchar(150) NOT NULL DEFAULT '',
    internship_supervisor_email varchar(254) NOT NULL DEFAULT '',
    supervisor_id uuid NULL,
    internship_duration varchar(100) NOT NULL DEFAULT '',
    department varchar(150) NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    start_date date NULL,
    end_date date NULL,
    student_id uuid NOT NULL,
    status public.internship_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_internship_supervisor
        FOREIGN KEY (supervisor_id)
        REFERENCES public.report_generator_supervisor (supervisor_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_internship_student
        FOREIGN KEY (student_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE
);

CREATE TABLE public.report_generator_log (
    log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    internship_id uuid NULL,
    student_name varchar(255) NOT NULL DEFAULT '',
    student_index_number varchar(50) NOT NULL DEFAULT '',
    department varchar(150) NOT NULL DEFAULT '',
    programme varchar(150) NOT NULL DEFAULT '',
    level varchar(20) NOT NULL DEFAULT '',
    institution varchar(255) NOT NULL DEFAULT '',
    company_name varchar(200) NOT NULL DEFAULT '',
    department_unit varchar(150) NOT NULL DEFAULT '',
    supervisor_name varchar(150) NOT NULL DEFAULT '',
    log_text text NOT NULL,
    status public.log_status NOT NULL DEFAULT 'draft',
    week_number smallint NULL,
    log_date date NULL,
    start_date date NULL,
    end_date date NULL,
    achievements text NOT NULL DEFAULT '',
    daily_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_log_student
        FOREIGN KEY (student_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_log_internship
        FOREIGN KEY (internship_id)
        REFERENCES public.report_generator_internship (internship_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_log_week_positive
        CHECK (week_number IS NULL OR week_number > 0)
);

CREATE TABLE public.report_generator_report (
    report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    report_file text NULL,
    status public.report_status NOT NULL DEFAULT 'generating',
    grade numeric(5,2) NULL,
    supervisor_feedback text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_report_student
        FOREIGN KEY (student_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_report_grade_range
        CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100))
);

CREATE TABLE public.report_generator_review (
    review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NULL,
    log_id uuid UNIQUE NULL,
    review_text text NOT NULL DEFAULT '',
    supervisor_id uuid NULL,
    decision public.review_decision NULL,
    comment text NOT NULL DEFAULT '',
    score smallint NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_review_report
        FOREIGN KEY (report_id)
        REFERENCES public.report_generator_report (report_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_review_log
        FOREIGN KEY (log_id)
        REFERENCES public.report_generator_log (log_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_review_supervisor
        FOREIGN KEY (supervisor_id)
        REFERENCES public.report_generator_supervisor (supervisor_id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_review_score_range
        CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

CREATE TABLE public.report_generator_appraisal (
    appraisal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL UNIQUE,
    supervisor_id uuid NOT NULL,
    scores jsonb NOT NULL DEFAULT '{}'::jsonb,
    general_comments text NOT NULL DEFAULT '',
    supervisor_name varchar(150) NOT NULL DEFAULT '',
    position varchar(150) NOT NULL DEFAULT '',
    signature text NOT NULL DEFAULT '',
    appraisal_date date NULL,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_appraisal_student
        FOREIGN KEY (student_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_appraisal_supervisor
        FOREIGN KEY (supervisor_id)
        REFERENCES public.report_generator_supervisor (supervisor_id)
        ON DELETE RESTRICT
);

CREATE TABLE public.report_generator_internshipreportdraft (
    id bigserial PRIMARY KEY,
    student_id uuid NOT NULL UNIQUE,
    introduction text NOT NULL DEFAULT '',
    abstract text NOT NULL DEFAULT '',
    conclusion text NOT NULL DEFAULT '',
    department varchar(255) NOT NULL DEFAULT '',
    company_name varchar(255) NOT NULL DEFAULT '',
    supervisor_name varchar(255) NOT NULL DEFAULT '',
    additional_notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_draft_student
        FOREIGN KEY (student_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE
);

CREATE TABLE public.report_generator_companyrequest (
    request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    location varchar(255) NOT NULL DEFAULT '',
    note text NOT NULL DEFAULT '',
    status public.company_request_status NOT NULL DEFAULT 'pending',
    requested_by_id uuid NOT NULL,
    reviewed_by_id integer NULL,
    reviewed_at timestamptz NULL,
    admin_note text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_companyrequest_student
        FOREIGN KEY (requested_by_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_companyrequest_reviewer
        FOREIGN KEY (reviewed_by_id)
        REFERENCES public.auth_user (id)
        ON DELETE SET NULL
);

CREATE TABLE public.report_generator_activitylog (
    activity_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id integer NOT NULL,
    actor_id integer NULL,
    activity_type varchar(80) NOT NULL,
    title varchar(255) NOT NULL,
    message text NOT NULL DEFAULT '',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_activity_recipient
        FOREIGN KEY (recipient_id)
        REFERENCES public.auth_user (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_activity_actor
        FOREIGN KEY (actor_id)
        REFERENCES public.auth_user (id)
        ON DELETE SET NULL
);

-- M2M join table for Student.supervisors
CREATE TABLE public.report_generator_student_supervisors (
    id bigserial PRIMARY KEY,
    student_id uuid NOT NULL,
    supervisor_id uuid NOT NULL,
    CONSTRAINT uq_student_supervisor_pair UNIQUE (student_id, supervisor_id),
    CONSTRAINT fk_m2m_student
        FOREIGN KEY (student_id)
        REFERENCES public.report_generator_student (student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_m2m_supervisor
        FOREIGN KEY (supervisor_id)
        REFERENCES public.report_generator_supervisor (supervisor_id)
        ON DELETE CASCADE
);

-- Helpful indexes for ERD-backed query performance
CREATE INDEX idx_company_created_by ON public.report_generator_company (created_by_id);
CREATE INDEX idx_internship_student ON public.report_generator_internship (student_id);
CREATE INDEX idx_internship_supervisor ON public.report_generator_internship (supervisor_id);
CREATE INDEX idx_log_student ON public.report_generator_log (student_id);
CREATE INDEX idx_log_internship ON public.report_generator_log (internship_id);
CREATE INDEX idx_report_student ON public.report_generator_report (student_id);
CREATE INDEX idx_review_report ON public.report_generator_review (report_id);
CREATE INDEX idx_review_supervisor ON public.report_generator_review (supervisor_id);
CREATE INDEX idx_companyrequest_student ON public.report_generator_companyrequest (requested_by_id);
CREATE INDEX idx_companyrequest_reviewer ON public.report_generator_companyrequest (reviewed_by_id);
CREATE INDEX idx_activity_recipient ON public.report_generator_activitylog (recipient_id);
CREATE INDEX idx_activity_actor ON public.report_generator_activitylog (actor_id);
CREATE INDEX idx_activity_created_at ON public.report_generator_activitylog (created_at);

-- End of schema
