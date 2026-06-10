--
-- PostgreSQL database dump
--

-- Dumped from database version 16.12 (Debian 16.12-1.pgdg13+1)
-- Dumped by pg_dump version 17.0

-- Started on 2026-06-04 11:34:01

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.12 (Debian 16.12-1.pgdg13+1)
-- Dumped by pg_dump version 17.0

-- Started on 2026-06-04 11:34:01

SET statement_timeout = 0;
SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;  (comentar)
-- SET transaction_timeout = 0;  (comentar)
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16568)
-- Name: activities; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.activities (
    id_activity bigint NOT NULL,
    description character varying(255),
    event_date timestamp(6) without time zone,
    external_reference_name character varying(255),
    id_company bigint,
    id_node bigint,
    title character varying(255)
);


ALTER TABLE public.activities OWNER TO admin;

--
-- TOC entry 223 (class 1259 OID 16567)
-- Name: activities_id_activity_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.activities_id_activity_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activities_id_activity_seq OWNER TO admin;

--
-- TOC entry 3570 (class 0 OID 0)
-- Dependencies: 223
-- Name: activities_id_activity_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.activities_id_activity_seq OWNED BY public.activities.id_activity;


--
-- TOC entry 226 (class 1259 OID 16587)
-- Name: activity_comments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.activity_comments (
    id_comment bigint NOT NULL,
    content text,
    created_at timestamp(6) without time zone,
    id_activity bigint,
    id_user bigint
);


ALTER TABLE public.activity_comments OWNER TO admin;

--
-- TOC entry 225 (class 1259 OID 16586)
-- Name: activity_comments_id_comment_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.activity_comments_id_comment_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_comments_id_comment_seq OWNER TO admin;

--
-- TOC entry 3571 (class 0 OID 0)
-- Dependencies: 225
-- Name: activity_comments_id_comment_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.activity_comments_id_comment_seq OWNED BY public.activity_comments.id_comment;


--
-- TOC entry 228 (class 1259 OID 16606)
-- Name: activity_task; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.activity_task (
    id_comment bigint NOT NULL,
    content text,
    created_at timestamp(6) without time zone,
    id_task bigint,
    id_user bigint
);


ALTER TABLE public.activity_task OWNER TO admin;

--
-- TOC entry 227 (class 1259 OID 16605)
-- Name: activity_task_id_comment_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.activity_task_id_comment_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_task_id_comment_seq OWNER TO admin;

--
-- TOC entry 3572 (class 0 OID 0)
-- Dependencies: 227
-- Name: activity_task_id_comment_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.activity_task_id_comment_seq OWNED BY public.activity_task.id_comment;


--
-- TOC entry 216 (class 1259 OID 16498)
-- Name: companies; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.companies (
    id_company bigint NOT NULL,
    description character varying(255),
    logo_path character varying(255),
    name character varying(255) NOT NULL,
    nas_root_folder character varying(255),
    status character varying(20),
    type character varying(20),
    CONSTRAINT companies_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'IN_PROGRESS'::character varying, 'ON_HOLD'::character varying, 'ARCHIVED'::character varying])::text[]))),
    CONSTRAINT companies_type_check CHECK (((type)::text = ANY ((ARRAY['MY_BUSINESS'::character varying, 'CLIENT'::character varying, 'PARTNERSHIP'::character varying, 'PERSONAL'::character varying])::text[])))
);


ALTER TABLE public.companies OWNER TO admin;

--
-- TOC entry 215 (class 1259 OID 16497)
-- Name: companies_id_company_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.companies_id_company_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_company_seq OWNER TO admin;

--
-- TOC entry 3573 (class 0 OID 0)
-- Dependencies: 215
-- Name: companies_id_company_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.companies_id_company_seq OWNED BY public.companies.id_company;


--
-- TOC entry 220 (class 1259 OID 16523)
-- Name: nodes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.nodes (
    id_node bigint NOT NULL,
    description character varying(255),
    id_company bigint,
    id_parent bigint,
    name character varying(255) NOT NULL,
    node_type character varying(255),
    real_path character varying(255)
);


ALTER TABLE public.nodes OWNER TO admin;

--
-- TOC entry 219 (class 1259 OID 16522)
-- Name: nodes_id_node_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.nodes_id_node_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nodes_id_node_seq OWNER TO admin;

--
-- TOC entry 3574 (class 0 OID 0)
-- Dependencies: 219
-- Name: nodes_id_node_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.nodes_id_node_seq OWNED BY public.nodes.id_node;


--
-- TOC entry 232 (class 1259 OID 16649)
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    id_notification bigint NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(255),
    id_user bigint NOT NULL,
    reference_type character varying(255) NOT NULL,
    reference_id bigint NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_reference_type_check CHECK (((reference_type)::text = ANY (ARRAY[('task'::character varying)::text, ('activity'::character varying)::text, ('pending'::character varying)::text])))
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- TOC entry 231 (class 1259 OID 16648)
-- Name: notifications_id_notification_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.notifications_id_notification_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_notification_seq OWNER TO admin;

--
-- TOC entry 3575 (class 0 OID 0)
-- Dependencies: 231
-- Name: notifications_id_notification_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.notifications_id_notification_seq OWNED BY public.notifications.id_notification;


--
-- TOC entry 230 (class 1259 OID 16625)
-- Name: pending_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.pending_items (
    id_pending bigint NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_by bigint NOT NULL,
    assigned_to bigint,
    reference_type character varying(255) NOT NULL,
    reference_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pending_items_reference_type_check CHECK (((reference_type)::text = ANY (ARRAY[('task'::character varying)::text, ('activity'::character varying)::text]))),
    CONSTRAINT pending_items_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text])))
);


ALTER TABLE public.pending_items OWNER TO admin;

--
-- TOC entry 229 (class 1259 OID 16624)
-- Name: pending_items_id_pending_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.pending_items_id_pending_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_items_id_pending_seq OWNER TO admin;

--
-- TOC entry 3576 (class 0 OID 0)
-- Dependencies: 229
-- Name: pending_items_id_pending_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.pending_items_id_pending_seq OWNED BY public.pending_items.id_pending;


--
-- TOC entry 234 (class 1259 OID 16690)
-- Name: project_objects; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.project_objects (
    id_object bigint NOT NULL,
    created_at timestamp(6) without time zone,
    created_by bigint,
    description character varying(255),
    id_node bigint NOT NULL,
    id_parent bigint,
    id_project bigint NOT NULL,
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.project_objects OWNER TO admin;

--
-- TOC entry 233 (class 1259 OID 16689)
-- Name: project_objects_id_object_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public.project_objects ALTER COLUMN id_object ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.project_objects_id_object_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 16698)
-- Name: projects; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.projects (
    id_project bigint NOT NULL,
    created_at timestamp(6) without time zone,
    created_by bigint NOT NULL,
    description character varying(255),
    id_node bigint NOT NULL,
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.projects OWNER TO admin;

--
-- TOC entry 235 (class 1259 OID 16697)
-- Name: projects_id_project_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public.projects ALTER COLUMN id_project ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.projects_id_project_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 238 (class 1259 OID 16706)
-- Name: reminders; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.reminders (
    id_reminder bigint NOT NULL,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    description character varying(255),
    id_object bigint,
    id_user bigint NOT NULL,
    is_completed boolean,
    reminder_date timestamp(6) without time zone NOT NULL,
    title character varying(255) NOT NULL
);


ALTER TABLE public.reminders OWNER TO admin;

--
-- TOC entry 237 (class 1259 OID 16705)
-- Name: reminders_id_reminder_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public.reminders ALTER COLUMN id_reminder ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.reminders_id_reminder_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 16544)
-- Name: tasks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.tasks (
    id_task bigint NOT NULL,
    description character varying(255),
    end_date date,
    external_reference_name character varying(255),
    id_company bigint,
    id_node bigint,
    id_user_assigned bigint,
    start_date date,
    status character varying(255),
    title character varying(255)
);


ALTER TABLE public.tasks OWNER TO admin;

--
-- TOC entry 221 (class 1259 OID 16543)
-- Name: tasks_id_task_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.tasks_id_task_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_task_seq OWNER TO admin;

--
-- TOC entry 3577 (class 0 OID 0)
-- Dependencies: 221
-- Name: tasks_id_task_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.tasks_id_task_seq OWNED BY public.tasks.id_task;


--
-- TOC entry 218 (class 1259 OID 16509)
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id_user bigint NOT NULL,
    color_code character varying(255),
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    profile_picture_path character varying(255),
    role character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'ASSISTANT'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO admin;

--
-- TOC entry 217 (class 1259 OID 16508)
-- Name: users_id_user_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_id_user_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_user_seq OWNER TO admin;

--
-- TOC entry 3578 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_user;


--
-- TOC entry 3326 (class 2604 OID 16571)
-- Name: activities id_activity; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activities ALTER COLUMN id_activity SET DEFAULT nextval('public.activities_id_activity_seq'::regclass);


--
-- TOC entry 3327 (class 2604 OID 16590)
-- Name: activity_comments id_comment; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_comments ALTER COLUMN id_comment SET DEFAULT nextval('public.activity_comments_id_comment_seq'::regclass);


--
-- TOC entry 3328 (class 2604 OID 16609)
-- Name: activity_task id_comment; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_task ALTER COLUMN id_comment SET DEFAULT nextval('public.activity_task_id_comment_seq'::regclass);


--
-- TOC entry 3322 (class 2604 OID 16501)
-- Name: companies id_company; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.companies ALTER COLUMN id_company SET DEFAULT nextval('public.companies_id_company_seq'::regclass);


--
-- TOC entry 3324 (class 2604 OID 16526)
-- Name: nodes id_node; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.nodes ALTER COLUMN id_node SET DEFAULT nextval('public.nodes_id_node_seq'::regclass);


--
-- TOC entry 3333 (class 2604 OID 16652)
-- Name: notifications id_notification; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id_notification SET DEFAULT nextval('public.notifications_id_notification_seq'::regclass);


--
-- TOC entry 3329 (class 2604 OID 16628)
-- Name: pending_items id_pending; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pending_items ALTER COLUMN id_pending SET DEFAULT nextval('public.pending_items_id_pending_seq'::regclass);


--
-- TOC entry 3325 (class 2604 OID 16547)
-- Name: tasks id_task; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id_task SET DEFAULT nextval('public.tasks_id_task_seq'::regclass);


--
-- TOC entry 3323 (class 2604 OID 16512)
-- Name: users id_user; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id_user SET DEFAULT nextval('public.users_id_user_seq'::regclass);


--
-- TOC entry 3550 (class 0 OID 16568)
-- Dependencies: 224
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.activities (id_activity, description, event_date, external_reference_name, id_company, id_node, title) FROM stdin;
1	PRUEBA	2026-06-04 11:34:00	PRUEBA	\N	\N	REVIEW
\.


--
-- TOC entry 3552 (class 0 OID 16587)
-- Dependencies: 226
-- Data for Name: activity_comments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.activity_comments (id_comment, content, created_at, id_activity, id_user) FROM stdin;
\.


--
-- TOC entry 3554 (class 0 OID 16606)
-- Dependencies: 228
-- Data for Name: activity_task; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.activity_task (id_comment, content, created_at, id_task, id_user) FROM stdin;
\.


--
-- TOC entry 3542 (class 0 OID 16498)
-- Dependencies: 216
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.companies (id_company, description, logo_path, name, nas_root_folder, status, type) FROM stdin;
\.


--
-- TOC entry 3546 (class 0 OID 16523)
-- Dependencies: 220
-- Data for Name: nodes; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.nodes (id_node, description, id_company, id_parent, name, node_type, real_path) FROM stdin;
1	GLOBAL	\N	\N	NAS	FOLDER	C:\\Users\\HP\\Desktop\\RFM\\application\\NAS
2	GACTIVITIES	\N	1	GACTIVITIES	FOLDER	C:\\Users\\HP\\Desktop\\RFM\\application\\NAS\\GACTIVITIES
3	GTASKS	\N	1	GTASKS	FOLDER	C:\\Users\\HP\\Desktop\\RFM\\application\\NAS\\GTASKS
\.


--
-- TOC entry 3558 (class 0 OID 16649)
-- Dependencies: 232
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notifications (id_notification, title, description, id_user, reference_type, reference_id, is_read, created_at) FROM stdin;
1	New task assigned	You have been assigned the task: PRUEBA	1	task	1	f	2026-06-04 11:33:05.956731
\.


--
-- TOC entry 3556 (class 0 OID 16625)
-- Dependencies: 230
-- Data for Name: pending_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.pending_items (id_pending, title, description, status, created_by, assigned_to, reference_type, reference_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3560 (class 0 OID 16690)
-- Dependencies: 234
-- Data for Name: project_objects; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.project_objects (id_object, created_at, created_by, description, id_node, id_parent, id_project, title, updated_at) FROM stdin;
\.


--
-- TOC entry 3562 (class 0 OID 16698)
-- Dependencies: 236
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.projects (id_project, created_at, created_by, description, id_node, title, updated_at) FROM stdin;
\.


--
-- TOC entry 3564 (class 0 OID 16706)
-- Dependencies: 238
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.reminders (id_reminder, completed_at, created_at, description, id_object, id_user, is_completed, reminder_date, title) FROM stdin;
\.


--
-- TOC entry 3548 (class 0 OID 16544)
-- Dependencies: 222
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.tasks (id_task, description, end_date, external_reference_name, id_company, id_node, id_user_assigned, start_date, status, title) FROM stdin;
1	PRUEBA	2026-06-10	NUEVO	\N	\N	1	2026-06-01	PENDING	PRUEBA
\.


--
-- TOC entry 3544 (class 0 OID 16509)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id_user, color_code, email, password, profile_picture_path, role, username) FROM stdin;
1	#C1D600	admin@rfm.com	$2a$10$gLNtDSY8XSU/pP2Jj8xmx.KCO7mAaa.RpBb.lfkDZ9jLqZJLM3BUq	C:/Users/HP/Desktop/RFM/application/NAS/profiles/default.png	ADMIN	admin
\.


--
-- TOC entry 3579 (class 0 OID 0)
-- Dependencies: 223
-- Name: activities_id_activity_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.activities_id_activity_seq', 1, true);


--
-- TOC entry 3580 (class 0 OID 0)
-- Dependencies: 225
-- Name: activity_comments_id_comment_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.activity_comments_id_comment_seq', 1, false);


--
-- TOC entry 3581 (class 0 OID 0)
-- Dependencies: 227
-- Name: activity_task_id_comment_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.activity_task_id_comment_seq', 1, false);


--
-- TOC entry 3582 (class 0 OID 0)
-- Dependencies: 215
-- Name: companies_id_company_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.companies_id_company_seq', 1, false);


--
-- TOC entry 3583 (class 0 OID 0)
-- Dependencies: 219
-- Name: nodes_id_node_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.nodes_id_node_seq', 5, true);


--
-- TOC entry 3584 (class 0 OID 0)
-- Dependencies: 231
-- Name: notifications_id_notification_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.notifications_id_notification_seq', 1, true);


--
-- TOC entry 3585 (class 0 OID 0)
-- Dependencies: 229
-- Name: pending_items_id_pending_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.pending_items_id_pending_seq', 1, false);


--
-- TOC entry 3586 (class 0 OID 0)
-- Dependencies: 233
-- Name: project_objects_id_object_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.project_objects_id_object_seq', 1, false);


--
-- TOC entry 3587 (class 0 OID 0)
-- Dependencies: 235
-- Name: projects_id_project_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.projects_id_project_seq', 1, false);


--
-- TOC entry 3588 (class 0 OID 0)
-- Dependencies: 237
-- Name: reminders_id_reminder_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.reminders_id_reminder_seq', 1, false);


--
-- TOC entry 3589 (class 0 OID 0)
-- Dependencies: 221
-- Name: tasks_id_task_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.tasks_id_task_seq', 1, true);


--
-- TOC entry 3590 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_id_user_seq', 1, true);


--
-- TOC entry 3359 (class 2606 OID 16575)
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id_activity);


--
-- TOC entry 3361 (class 2606 OID 16594)
-- Name: activity_comments activity_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT activity_comments_pkey PRIMARY KEY (id_comment);


--
-- TOC entry 3363 (class 2606 OID 16613)
-- Name: activity_task activity_task_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_task
    ADD CONSTRAINT activity_task_pkey PRIMARY KEY (id_comment);


--
-- TOC entry 3343 (class 2606 OID 16507)
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- TOC entry 3345 (class 2606 OID 16505)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id_company);


--
-- TOC entry 3353 (class 2606 OID 16532)
-- Name: nodes nodes_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_name_key UNIQUE (name);


--
-- TOC entry 3355 (class 2606 OID 16530)
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id_node);


--
-- TOC entry 3369 (class 2606 OID 16659)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id_notification);


--
-- TOC entry 3366 (class 2606 OID 16637)
-- Name: pending_items pending_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pending_items
    ADD CONSTRAINT pending_items_pkey PRIMARY KEY (id_pending);


--
-- TOC entry 3371 (class 2606 OID 16696)
-- Name: project_objects project_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.project_objects
    ADD CONSTRAINT project_objects_pkey PRIMARY KEY (id_object);


--
-- TOC entry 3373 (class 2606 OID 16704)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id_project);


--
-- TOC entry 3375 (class 2606 OID 16712)
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id_reminder);


--
-- TOC entry 3357 (class 2606 OID 16551)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id_task);


--
-- TOC entry 3347 (class 2606 OID 16519)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3349 (class 2606 OID 16517)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);


--
-- TOC entry 3351 (class 2606 OID 16521)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3367 (class 1259 OID 16666)
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (id_user, is_read);


--
-- TOC entry 3364 (class 1259 OID 16685)
-- Name: idx_pending_reference; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pending_reference ON public.pending_items USING btree (reference_type, reference_id);


--
-- TOC entry 3381 (class 2606 OID 16576)
-- Name: activities fk_activities_company; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_company FOREIGN KEY (id_company) REFERENCES public.companies(id_company) ON DELETE SET NULL;


--
-- TOC entry 3382 (class 2606 OID 16581)
-- Name: activities fk_activities_node; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_node FOREIGN KEY (id_node) REFERENCES public.nodes(id_node) ON DELETE SET NULL;


--
-- TOC entry 3383 (class 2606 OID 16595)
-- Name: activity_comments fk_activity_comments_activity; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT fk_activity_comments_activity FOREIGN KEY (id_activity) REFERENCES public.activities(id_activity) ON DELETE CASCADE;


--
-- TOC entry 3384 (class 2606 OID 16600)
-- Name: activity_comments fk_activity_comments_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_comments
    ADD CONSTRAINT fk_activity_comments_user FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE SET NULL;


--
-- TOC entry 3385 (class 2606 OID 16614)
-- Name: activity_task fk_activity_task_task; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_task
    ADD CONSTRAINT fk_activity_task_task FOREIGN KEY (id_task) REFERENCES public.tasks(id_task) ON DELETE CASCADE;


--
-- TOC entry 3386 (class 2606 OID 16619)
-- Name: activity_task fk_activity_task_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.activity_task
    ADD CONSTRAINT fk_activity_task_user FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE SET NULL;


--
-- TOC entry 3376 (class 2606 OID 16533)
-- Name: nodes fk_nodes_company; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT fk_nodes_company FOREIGN KEY (id_company) REFERENCES public.companies(id_company) ON DELETE CASCADE;


--
-- TOC entry 3377 (class 2606 OID 16538)
-- Name: nodes fk_nodes_parent; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT fk_nodes_parent FOREIGN KEY (id_parent) REFERENCES public.nodes(id_node) ON DELETE SET NULL;


--
-- TOC entry 3389 (class 2606 OID 16660)
-- Name: notifications fk_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON DELETE CASCADE;


--
-- TOC entry 3387 (class 2606 OID 16643)
-- Name: pending_items fk_pending_assigned_to; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pending_items
    ADD CONSTRAINT fk_pending_assigned_to FOREIGN KEY (assigned_to) REFERENCES public.users(id_user) ON DELETE SET NULL;


--
-- TOC entry 3388 (class 2606 OID 16638)
-- Name: pending_items fk_pending_created_by; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pending_items
    ADD CONSTRAINT fk_pending_created_by FOREIGN KEY (created_by) REFERENCES public.users(id_user) ON DELETE CASCADE;


--
-- TOC entry 3378 (class 2606 OID 16552)
-- Name: tasks fk_tasks_company; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_company FOREIGN KEY (id_company) REFERENCES public.companies(id_company) ON DELETE SET NULL;


--
-- TOC entry 3379 (class 2606 OID 16557)
-- Name: tasks fk_tasks_node; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_node FOREIGN KEY (id_node) REFERENCES public.nodes(id_node) ON DELETE SET NULL;


--
-- TOC entry 3380 (class 2606 OID 16562)
-- Name: tasks fk_tasks_user_assigned; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_user_assigned FOREIGN KEY (id_user_assigned) REFERENCES public.users(id_user) ON DELETE SET NULL;


--
-- TOC entry 3390 (class 2606 OID 16738)
-- Name: project_objects project_objects_nodes_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.project_objects
    ADD CONSTRAINT project_objects_nodes_fk FOREIGN KEY (id_node) REFERENCES public.nodes(id_node);


--
-- TOC entry 3391 (class 2606 OID 16723)
-- Name: project_objects project_objects_project_objects_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.project_objects
    ADD CONSTRAINT project_objects_project_objects_fk FOREIGN KEY (id_parent) REFERENCES public.project_objects(id_object);


--
-- TOC entry 3392 (class 2606 OID 16728)
-- Name: project_objects project_objects_projects_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.project_objects
    ADD CONSTRAINT project_objects_projects_fk FOREIGN KEY (id_project) REFERENCES public.projects(id_project);


--
-- TOC entry 3393 (class 2606 OID 16733)
-- Name: project_objects project_objects_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.project_objects
    ADD CONSTRAINT project_objects_users_fk FOREIGN KEY (created_by) REFERENCES public.users(id_user);


--
-- TOC entry 3394 (class 2606 OID 16713)
-- Name: projects projects_nodes_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_nodes_fk FOREIGN KEY (id_node) REFERENCES public.nodes(id_node);


--
-- TOC entry 3395 (class 2606 OID 16718)
-- Name: projects projects_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_users_fk FOREIGN KEY (created_by) REFERENCES public.users(id_user);


--
-- TOC entry 3396 (class 2606 OID 16743)
-- Name: reminders reminders_project_objects_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_project_objects_fk FOREIGN KEY (id_object) REFERENCES public.project_objects(id_object);


--
-- TOC entry 3397 (class 2606 OID 16748)
-- Name: reminders reminders_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_users_fk FOREIGN KEY (id_user) REFERENCES public.users(id_user);


-- Completed on 2026-06-04 11:34:01

--
-- PostgreSQL database dump complete
--

