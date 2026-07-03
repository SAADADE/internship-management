--
-- PostgreSQL database dump
--

\restrict d7PHOSKdx4xXo7MBUViwNDMmfLKMdihiKpisUTO6FLP33UZR7BevhJErNHuFNQk

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-13 20:45:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16388)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 913 (class 1247 OID 16738)
-- Name: internship_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.internship_status AS ENUM (
    'pending',
    'active',
    'completed',
    'rejected'
);


ALTER TYPE public.internship_status OWNER TO postgres;

--
-- TOC entry 916 (class 1247 OID 16748)
-- Name: log_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.log_status AS ENUM (
    'draft',
    'submitted',
    'reviewed',
    'needs_revision'
);


ALTER TYPE public.log_status OWNER TO postgres;

--
-- TOC entry 919 (class 1247 OID 16758)
-- Name: report_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.report_status AS ENUM (
    'generating',
    'ready',
    'graded'
);


ALTER TYPE public.report_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16655)
-- Name: internship; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.internship (
    internship_id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying(200) NOT NULL,
    company_address text,
    internship_position character varying(150) NOT NULL,
    internship_supervisor character varying(150),
    internship_supervisor_email character varying(255),
    internship_duration character varying(100),
    student_id uuid NOT NULL,
    status public.internship_status DEFAULT 'pending'::public.internship_status NOT NULL
);


ALTER TABLE public.internship OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16673)
-- Name: log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    log_text text NOT NULL,
    status public.log_status DEFAULT 'draft'::public.log_status NOT NULL,
    week_number smallint,
    log_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT log_week_number_check CHECK ((week_number >= 1))
);


ALTER TABLE public.log OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16690)
-- Name: report; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report (
    report_id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    report_file text,
    status public.report_status DEFAULT 'generating'::public.report_status NOT NULL,
    grade numeric(4,2),
    supervisor_feedback text,
    CONSTRAINT report_grade_check CHECK (((grade >= (0)::numeric) AND (grade <= (100)::numeric)))
);


ALTER TABLE public.report OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16706)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    review_id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_id uuid NOT NULL,
    log_id uuid,
    review_text text NOT NULL,
    supervisor_id uuid NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16632)
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student (
    student_id uuid DEFAULT gen_random_uuid() NOT NULL,
    teams_id character varying(100),
    sch_email character varying(255) NOT NULL,
    index_number character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    supervisor_id uuid,
    password_hash text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.student OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16624)
-- Name: supervisor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supervisor (
    supervisor_id uuid DEFAULT gen_random_uuid() NOT NULL,
    fullname character varying(150) NOT NULL,
    password_hash text DEFAULT ''::text NOT NULL,
    email character varying(255)
);


ALTER TABLE public.supervisor OWNER TO postgres;

--
-- TOC entry 5070 (class 0 OID 16655)
-- Dependencies: 222
-- Data for Name: internship; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internship (internship_id, company_name, company_address, internship_position, internship_supervisor, internship_supervisor_email, internship_duration, student_id, status) FROM stdin;
\.


--
-- TOC entry 5071 (class 0 OID 16673)
-- Dependencies: 223
-- Data for Name: log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log (log_id, student_id, log_text, status, week_number, log_date, created_at) FROM stdin;
\.


--
-- TOC entry 5072 (class 0 OID 16690)
-- Dependencies: 224
-- Data for Name: report; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report (report_id, student_id, report_file, status, grade, supervisor_feedback) FROM stdin;
\.


--
-- TOC entry 5073 (class 0 OID 16706)
-- Dependencies: 225
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (review_id, report_id, log_id, review_text, supervisor_id) FROM stdin;
\.


--
-- TOC entry 5069 (class 0 OID 16632)
-- Dependencies: 221
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student (student_id, teams_id, sch_email, index_number, first_name, last_name, supervisor_id, password_hash) FROM stdin;
\.


--
-- TOC entry 5068 (class 0 OID 16624)
-- Dependencies: 220
-- Data for Name: supervisor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supervisor (supervisor_id, fullname, password_hash, email) FROM stdin;
\.


--
-- TOC entry 4902 (class 2606 OID 16666)
-- Name: internship internship_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internship
    ADD CONSTRAINT internship_pkey PRIMARY KEY (internship_id);


--
-- TOC entry 4905 (class 2606 OID 16683)
-- Name: log log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4908 (class 2606 OID 16699)
-- Name: report report_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pkey PRIMARY KEY (report_id);


--
-- TOC entry 4913 (class 2606 OID 16716)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 4895 (class 2606 OID 16648)
-- Name: student student_index_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_index_number_key UNIQUE (index_number);


--
-- TOC entry 4897 (class 2606 OID 16644)
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (student_id);


--
-- TOC entry 4899 (class 2606 OID 16646)
-- Name: student student_sch_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_sch_email_key UNIQUE (sch_email);


--
-- TOC entry 4890 (class 2606 OID 16736)
-- Name: supervisor supervisor_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supervisor
    ADD CONSTRAINT supervisor_email_key UNIQUE (email);


--
-- TOC entry 4892 (class 2606 OID 16631)
-- Name: supervisor supervisor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supervisor
    ADD CONSTRAINT supervisor_pkey PRIMARY KEY (supervisor_id);


--
-- TOC entry 4900 (class 1259 OID 16672)
-- Name: idx_internship_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_internship_student ON public.internship USING btree (student_id);


--
-- TOC entry 4903 (class 1259 OID 16689)
-- Name: idx_log_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_student ON public.log USING btree (student_id);


--
-- TOC entry 4906 (class 1259 OID 16705)
-- Name: idx_report_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_student ON public.report USING btree (student_id);


--
-- TOC entry 4909 (class 1259 OID 16728)
-- Name: idx_reviews_log; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_log ON public.reviews USING btree (log_id);


--
-- TOC entry 4910 (class 1259 OID 16727)
-- Name: idx_reviews_report; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_report ON public.reviews USING btree (report_id);


--
-- TOC entry 4911 (class 1259 OID 16781)
-- Name: idx_reviews_supervisor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_supervisor ON public.reviews USING btree (supervisor_id);


--
-- TOC entry 4893 (class 1259 OID 16654)
-- Name: idx_student_supervisor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_supervisor ON public.student USING btree (supervisor_id);


--
-- TOC entry 4915 (class 2606 OID 16667)
-- Name: internship internship_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internship
    ADD CONSTRAINT internship_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id) ON DELETE CASCADE;


--
-- TOC entry 4916 (class 2606 OID 16684)
-- Name: log log_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 16700)
-- Name: report report_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id) ON DELETE CASCADE;


--
-- TOC entry 4918 (class 2606 OID 16722)
-- Name: reviews reviews_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.log(log_id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 16717)
-- Name: reviews reviews_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report(report_id) ON DELETE CASCADE;


--
-- TOC entry 4920 (class 2606 OID 16776)
-- Name: reviews reviews_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.supervisor(supervisor_id) ON DELETE RESTRICT;


--
-- TOC entry 4914 (class 2606 OID 16649)
-- Name: student student_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.supervisor(supervisor_id) ON DELETE SET NULL;


-- Completed on 2026-06-13 20:45:12

--
-- PostgreSQL database dump complete
--

\unrestrict d7PHOSKdx4xXo7MBUViwNDMmfLKMdihiKpisUTO6FLP33UZR7BevhJErNHuFNQk

