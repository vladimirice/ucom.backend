--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE uos;
ALTER ROLE uos WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'md5a77a84dc26933f67f66a78920f2fc9c5';






--
-- Database creation
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;
CREATE DATABASE uos_backend_app WITH TEMPLATE = template0 OWNER = uos;


\connect postgres

SET default_transaction_read_only = off;

--
-- PostgreSQL database dump
--

-- Dumped from database version 10.6 (Debian 10.6-1.pgdg90+1)
-- Dumped by pg_dump version 10.6 (Debian 10.6-1.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: uos
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- PostgreSQL database dump complete
--

\connect template1

SET default_transaction_read_only = off;

--
-- PostgreSQL database dump
--

-- Dumped from database version 10.6 (Debian 10.6-1.pgdg90+1)
-- Dumped by pg_dump version 10.6 (Debian 10.6-1.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: uos
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- PostgreSQL database dump complete
--

\connect uos_backend_app

SET default_transaction_read_only = off;

--
-- PostgreSQL database dump
--

-- Dumped from database version 10.6 (Debian 10.6-1.pgdg90+1)
-- Dumped by pg_dump version 10.6 (Debian 10.6-1.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO uos;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    account_name character varying(255) NOT NULL,
    nickname character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    email character varying(255),
    phone_number character varying(255),
    birthday date,
    about text,
    country character varying(255),
    city character varying(255),
    address character varying(255),
    mood_message character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    avatar_filename character varying(255),
    public_key character varying(255) NOT NULL,
    currency_to_show character varying(255),
    first_currency character varying(255),
    first_currency_year character varying(255),
    personal_website_url character varying(255),
    achievements_filename character varying(255),
    current_rate numeric(20,10) DEFAULT 0 NOT NULL,
    private_key character varying(255),
    blockchain_registration_status character varying(255) DEFAULT 0,
    owner_public_key character varying(255),
    is_tracking_allowed boolean DEFAULT false
);


ALTER TABLE public."Users" OWNER TO uos;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Users_id_seq" OWNER TO uos;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: activity_user_comment; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.activity_user_comment (
    id integer NOT NULL,
    activity_type_id integer NOT NULL,
    blockchain_status integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id_from integer NOT NULL,
    comment_id_to integer NOT NULL
);


ALTER TABLE public.activity_user_comment OWNER TO uos;

--
-- Name: activity_user_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.activity_user_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_user_comment_id_seq OWNER TO uos;

--
-- Name: activity_user_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.activity_user_comment_id_seq OWNED BY public.activity_user_comment.id;


--
-- Name: activity_user_post; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.activity_user_post (
    id integer NOT NULL,
    activity_type_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id_from integer NOT NULL,
    post_id_to integer NOT NULL,
    blockchain_status character varying(255) DEFAULT 0
);


ALTER TABLE public.activity_user_post OWNER TO uos;

--
-- Name: activity_user_post_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.activity_user_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_user_post_id_seq OWNER TO uos;

--
-- Name: activity_user_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.activity_user_post_id_seq OWNED BY public.activity_user_post.id;


--
-- Name: activity_user_user; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.activity_user_user (
    id integer NOT NULL,
    activity_type_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id_from integer,
    user_id_to integer,
    blockchain_status integer DEFAULT 0,
    signed_transaction text,
    blockchain_response text
);


ALTER TABLE public.activity_user_user OWNER TO uos;

--
-- Name: activity_user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.activity_user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_user_user_id_seq OWNER TO uos;

--
-- Name: activity_user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.activity_user_user_id_seq OWNED BY public.activity_user_user.id;


--
-- Name: blockchain_nodes; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.blockchain_nodes (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    votes_count integer DEFAULT 0 NOT NULL,
    votes_amount bigint DEFAULT 0 NOT NULL,
    currency character varying(255) NOT NULL,
    bp_status smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT blockchain_nodes_votes_amount_check CHECK ((votes_amount >= 0)),
    CONSTRAINT blockchain_nodes_votes_count_check CHECK ((votes_count >= 0))
);


ALTER TABLE public.blockchain_nodes OWNER TO uos;

--
-- Name: blockchain_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.blockchain_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blockchain_nodes_id_seq OWNER TO uos;

--
-- Name: blockchain_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.blockchain_nodes_id_seq OWNED BY public.blockchain_nodes.id;


--
-- Name: blockchain_tr_traces; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.blockchain_tr_traces (
    id bigint NOT NULL,
    tr_type smallint NOT NULL,
    tr_processed_data jsonb NOT NULL,
    memo character varying(2048) DEFAULT ''::character varying NOT NULL,
    tr_id character varying(1024) NOT NULL,
    external_id character varying(1024) NOT NULL,
    account_name_from character varying(255) DEFAULT NULL::character varying,
    account_name_to character varying(255) DEFAULT NULL::character varying,
    raw_tr_data jsonb NOT NULL,
    tr_executed_at timestamp with time zone NOT NULL,
    mongodb_created_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blockchain_tr_traces OWNER TO uos;

--
-- Name: blockchain_tr_traces_rn_2; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.blockchain_tr_traces_rn_2 (
    id bigint NOT NULL,
    tr_type smallint NOT NULL,
    tr_processed_data jsonb NOT NULL,
    memo character varying(2048) DEFAULT ''::character varying NOT NULL,
    tr_id character varying(1024) NOT NULL,
    external_id character varying(1024) NOT NULL,
    account_name_from character varying(255) DEFAULT NULL::character varying,
    account_name_to character varying(255) DEFAULT NULL::character varying,
    raw_tr_data jsonb NOT NULL,
    tr_executed_at timestamp with time zone NOT NULL,
    mongodb_created_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blockchain_tr_traces_rn_2 OWNER TO uos;

--
-- Name: blockchain_tr_traces_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.blockchain_tr_traces_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blockchain_tr_traces_id_seq OWNER TO uos;

--
-- Name: blockchain_tr_traces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.blockchain_tr_traces_id_seq OWNED BY public.blockchain_tr_traces_rn_2.id;


--
-- Name: blockchain_tr_traces_rn_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.blockchain_tr_traces_rn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blockchain_tr_traces_rn_id_seq OWNER TO uos;

--
-- Name: blockchain_tr_traces_rn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.blockchain_tr_traces_rn_id_seq OWNED BY public.blockchain_tr_traces.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    description text NOT NULL,
    current_vote integer DEFAULT 0 NOT NULL,
    path character varying(255),
    commentable_id integer NOT NULL,
    blockchain_status integer DEFAULT 0 NOT NULL,
    blockchain_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id integer,
    user_id integer NOT NULL,
    depth integer,
    organization_id integer
);


ALTER TABLE public.comments OWNER TO uos;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO uos;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: entity_event_param; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.entity_event_param (
    id integer NOT NULL,
    entity_blockchain_id character varying(255) NOT NULL,
    entity_name character(10) NOT NULL,
    json_value jsonb NOT NULL,
    event_type smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.entity_event_param OWNER TO uos;

--
-- Name: entity_event_param_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.entity_event_param_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entity_event_param_id_seq OWNER TO uos;

--
-- Name: entity_event_param_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.entity_event_param_id_seq OWNED BY public.entity_event_param.id;


--
-- Name: entity_notifications; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.entity_notifications (
    id integer NOT NULL,
    domain_id smallint NOT NULL,
    event_id smallint NOT NULL,
    title character varying(1024) NOT NULL,
    description text NOT NULL,
    finished boolean DEFAULT false NOT NULL,
    seen boolean DEFAULT false NOT NULL,
    confirmed smallint DEFAULT 0 NOT NULL,
    severity smallint DEFAULT 6 NOT NULL,
    notification_type_id smallint NOT NULL,
    recipient_entity_id bigint NOT NULL,
    recipient_entity_name character(10) NOT NULL,
    entity_id bigint NOT NULL,
    entity_name character(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    target_entity_id bigint,
    target_entity_name character(10) DEFAULT NULL::bpchar,
    users_activity_id integer,
    user_id_from integer,
    json_body jsonb
);


ALTER TABLE public.entity_notifications OWNER TO uos;

--
-- Name: entity_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.entity_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entity_notifications_id_seq OWNER TO uos;

--
-- Name: entity_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.entity_notifications_id_seq OWNED BY public.entity_notifications.id;


--
-- Name: entity_sources; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.entity_sources (
    id integer NOT NULL,
    source_url character varying(2048) DEFAULT ''::character varying NOT NULL,
    is_official boolean DEFAULT false NOT NULL,
    source_type_id smallint,
    source_group_id smallint NOT NULL,
    entity_id bigint NOT NULL,
    entity_name character(10) NOT NULL,
    source_entity_id bigint,
    source_entity_name character(10),
    text_data text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_filename character varying(1024)
);


ALTER TABLE public.entity_sources OWNER TO uos;

--
-- Name: entity_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.entity_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entity_sources_id_seq OWNER TO uos;

--
-- Name: entity_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.entity_sources_id_seq OWNED BY public.entity_sources.id;


--
-- Name: entity_state_log; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.entity_state_log (
    id bigint NOT NULL,
    entity_id bigint NOT NULL,
    entity_name character(10) NOT NULL,
    state_json jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.entity_state_log OWNER TO uos;

--
-- Name: entity_state_log_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.entity_state_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entity_state_log_id_seq OWNER TO uos;

--
-- Name: entity_state_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.entity_state_log_id_seq OWNED BY public.entity_state_log.id;


--
-- Name: entity_stats_current; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.entity_stats_current (
    id integer NOT NULL,
    entity_id bigint NOT NULL,
    entity_name character(10) NOT NULL,
    importance_delta numeric(20,10) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    upvote_delta smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.entity_stats_current OWNER TO uos;

--
-- Name: entity_stats_current_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.entity_stats_current_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entity_stats_current_id_seq OWNER TO uos;

--
-- Name: entity_stats_current_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.entity_stats_current_id_seq OWNED BY public.entity_stats_current.id;


--
-- Name: entity_tags; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.entity_tags (
    id bigint NOT NULL,
    tag_id bigint NOT NULL,
    tag_title character varying(2048) NOT NULL,
    user_id integer NOT NULL,
    org_id integer,
    entity_id bigint NOT NULL,
    entity_name character(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.entity_tags OWNER TO uos;

--
-- Name: entity_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.entity_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entity_tags_id_seq OWNER TO uos;

--
-- Name: entity_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.entity_tags_id_seq OWNED BY public.entity_tags.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    avatar_filename character varying(255),
    title character varying(255) NOT NULL,
    currency_to_show character varying(255),
    powered_by character varying(255),
    about text,
    nickname character varying(255) NOT NULL,
    email character varying(255),
    phone_number character varying(255),
    country character varying(255),
    city character varying(255),
    address character varying(255),
    personal_website_url character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    blockchain_id character varying(255),
    current_rate numeric(20,10) DEFAULT 0 NOT NULL
);


ALTER TABLE public.organizations OWNER TO uos;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organizations_id_seq OWNER TO uos;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: post_ipfs_meta; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.post_ipfs_meta (
    id integer NOT NULL,
    path character varying(255) NOT NULL,
    hash character varying(255) NOT NULL,
    ipfs_size integer NOT NULL,
    ipfs_status integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    post_id integer NOT NULL
);


ALTER TABLE public.post_ipfs_meta OWNER TO uos;

--
-- Name: post_ipfs_meta_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.post_ipfs_meta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_ipfs_meta_id_seq OWNER TO uos;

--
-- Name: post_ipfs_meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.post_ipfs_meta_id_seq OWNED BY public.post_ipfs_meta.id;


--
-- Name: post_offer; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.post_offer (
    id integer NOT NULL,
    action_button_title character varying(255),
    action_button_url character varying(255),
    action_duration_in_days integer,
    post_id integer
);


ALTER TABLE public.post_offer OWNER TO uos;

--
-- Name: post_offer_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.post_offer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_offer_id_seq OWNER TO uos;

--
-- Name: post_offer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.post_offer_id_seq OWNED BY public.post_offer.id;


--
-- Name: post_stats; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.post_stats (
    id integer NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    post_id integer
);


ALTER TABLE public.post_stats OWNER TO uos;

--
-- Name: post_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.post_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_stats_id_seq OWNER TO uos;

--
-- Name: post_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.post_stats_id_seq OWNED BY public.post_stats.id;


--
-- Name: post_users_team; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.post_users_team (
    id integer NOT NULL,
    post_id integer,
    user_id integer
);


ALTER TABLE public.post_users_team OWNER TO uos;

--
-- Name: post_users_team_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.post_users_team_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_users_team_id_seq OWNER TO uos;

--
-- Name: post_users_team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.post_users_team_id_seq OWNED BY public.post_users_team.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    post_type_id integer,
    title character varying(255),
    description text,
    main_image_filename character varying(255),
    current_vote integer,
    current_rate numeric(20,10) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer,
    leading_text character varying(255),
    blockchain_id character varying(255),
    blockchain_status character varying(255) DEFAULT 0,
    organization_id integer,
    entity_id_for bigint NOT NULL,
    entity_name_for character(10) NOT NULL,
    parent_id integer,
    entity_images jsonb,
    entity_tags text[]
);


ALTER TABLE public.posts OWNER TO uos;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO uos;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.tags (
    id bigint NOT NULL,
    title character varying(2048) NOT NULL,
    first_entity_id bigint NOT NULL,
    first_entity_name character(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    current_rate numeric(20,10) DEFAULT 0 NOT NULL,
    current_posts_amount bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.tags OWNER TO uos;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tags_id_seq OWNER TO uos;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: users_activity; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.users_activity (
    id integer NOT NULL,
    activity_type_id smallint NOT NULL,
    user_id_from integer NOT NULL,
    entity_id_to bigint NOT NULL,
    entity_name character varying(255) NOT NULL,
    signed_transaction text NOT NULL,
    blockchain_response text DEFAULT ''::text NOT NULL,
    blockchain_status smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    activity_group_id smallint NOT NULL,
    entity_id_on bigint,
    entity_name_on character(10) DEFAULT NULL::bpchar,
    event_id smallint
);


ALTER TABLE public.users_activity OWNER TO uos;

--
-- Name: users_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.users_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_activity_id_seq OWNER TO uos;

--
-- Name: users_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.users_activity_id_seq OWNED BY public.users_activity.id;


--
-- Name: users_education; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.users_education (
    id integer NOT NULL,
    title character varying(255),
    speciality character varying(255),
    degree character varying(255),
    start_date date,
    end_date date,
    is_current boolean,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer
);


ALTER TABLE public.users_education OWNER TO uos;

--
-- Name: users_education_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.users_education_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_education_id_seq OWNER TO uos;

--
-- Name: users_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.users_education_id_seq OWNED BY public.users_education.id;


--
-- Name: users_jobs; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.users_jobs (
    id integer NOT NULL,
    title character varying(255),
    "position" character varying(255),
    start_date date,
    end_date date,
    is_current boolean,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer
);


ALTER TABLE public.users_jobs OWNER TO uos;

--
-- Name: users_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.users_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_jobs_id_seq OWNER TO uos;

--
-- Name: users_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.users_jobs_id_seq OWNED BY public.users_jobs.id;


--
-- Name: users_sources; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.users_sources (
    id integer NOT NULL,
    source_url character varying(255),
    is_official boolean,
    source_type_id integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer
);


ALTER TABLE public.users_sources OWNER TO uos;

--
-- Name: users_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.users_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_sources_id_seq OWNER TO uos;

--
-- Name: users_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.users_sources_id_seq OWNED BY public.users_sources.id;


--
-- Name: users_team; Type: TABLE; Schema: public; Owner: uos
--

CREATE TABLE public.users_team (
    id integer NOT NULL,
    user_id integer NOT NULL,
    entity_id bigint NOT NULL,
    entity_name character(10) NOT NULL,
    status smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users_team OWNER TO uos;

--
-- Name: users_team_id_seq; Type: SEQUENCE; Schema: public; Owner: uos
--

CREATE SEQUENCE public.users_team_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_team_id_seq OWNER TO uos;

--
-- Name: users_team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: uos
--

ALTER SEQUENCE public.users_team_id_seq OWNED BY public.users_team.id;


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: activity_user_comment id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_comment ALTER COLUMN id SET DEFAULT nextval('public.activity_user_comment_id_seq'::regclass);


--
-- Name: activity_user_post id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_post ALTER COLUMN id SET DEFAULT nextval('public.activity_user_post_id_seq'::regclass);


--
-- Name: activity_user_user id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_user ALTER COLUMN id SET DEFAULT nextval('public.activity_user_user_id_seq'::regclass);


--
-- Name: blockchain_nodes id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_nodes ALTER COLUMN id SET DEFAULT nextval('public.blockchain_nodes_id_seq'::regclass);


--
-- Name: blockchain_tr_traces id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces ALTER COLUMN id SET DEFAULT nextval('public.blockchain_tr_traces_rn_id_seq'::regclass);


--
-- Name: blockchain_tr_traces_rn_2 id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces_rn_2 ALTER COLUMN id SET DEFAULT nextval('public.blockchain_tr_traces_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: entity_event_param id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_event_param ALTER COLUMN id SET DEFAULT nextval('public.entity_event_param_id_seq'::regclass);


--
-- Name: entity_notifications id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_notifications ALTER COLUMN id SET DEFAULT nextval('public.entity_notifications_id_seq'::regclass);


--
-- Name: entity_sources id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_sources ALTER COLUMN id SET DEFAULT nextval('public.entity_sources_id_seq'::regclass);


--
-- Name: entity_state_log id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_state_log ALTER COLUMN id SET DEFAULT nextval('public.entity_state_log_id_seq'::regclass);


--
-- Name: entity_stats_current id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_stats_current ALTER COLUMN id SET DEFAULT nextval('public.entity_stats_current_id_seq'::regclass);


--
-- Name: entity_tags id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_tags ALTER COLUMN id SET DEFAULT nextval('public.entity_tags_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: post_ipfs_meta id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_ipfs_meta ALTER COLUMN id SET DEFAULT nextval('public.post_ipfs_meta_id_seq'::regclass);


--
-- Name: post_offer id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_offer ALTER COLUMN id SET DEFAULT nextval('public.post_offer_id_seq'::regclass);


--
-- Name: post_stats id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_stats ALTER COLUMN id SET DEFAULT nextval('public.post_stats_id_seq'::regclass);


--
-- Name: post_users_team id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_users_team ALTER COLUMN id SET DEFAULT nextval('public.post_users_team_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: users_activity id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_activity ALTER COLUMN id SET DEFAULT nextval('public.users_activity_id_seq'::regclass);


--
-- Name: users_education id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_education ALTER COLUMN id SET DEFAULT nextval('public.users_education_id_seq'::regclass);


--
-- Name: users_jobs id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_jobs ALTER COLUMN id SET DEFAULT nextval('public.users_jobs_id_seq'::regclass);


--
-- Name: users_sources id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_sources ALTER COLUMN id SET DEFAULT nextval('public.users_sources_id_seq'::regclass);


--
-- Name: users_team id; Type: DEFAULT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_team ALTER COLUMN id SET DEFAULT nextval('public.users_team_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: Users Users_account_name_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_account_name_key" UNIQUE (account_name);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_nickname_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_nickname_key" UNIQUE (nickname);


--
-- Name: Users Users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_phone_number_key" UNIQUE (phone_number);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_public_key_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_public_key_key" UNIQUE (public_key);


--
-- Name: activity_user_comment activity_user_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_comment
    ADD CONSTRAINT activity_user_comment_pkey PRIMARY KEY (id);


--
-- Name: activity_user_post activity_user_post_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_post
    ADD CONSTRAINT activity_user_post_pkey PRIMARY KEY (id);


--
-- Name: activity_user_user activity_user_user_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_user
    ADD CONSTRAINT activity_user_user_pkey PRIMARY KEY (id);


--
-- Name: blockchain_nodes blockchain_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_nodes
    ADD CONSTRAINT blockchain_nodes_pkey PRIMARY KEY (id);


--
-- Name: blockchain_nodes blockchain_nodes_title_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_nodes
    ADD CONSTRAINT blockchain_nodes_title_key UNIQUE (title);


--
-- Name: blockchain_tr_traces_rn_2 blockchain_tr_traces_external_id_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces_rn_2
    ADD CONSTRAINT blockchain_tr_traces_external_id_key UNIQUE (external_id);


--
-- Name: blockchain_tr_traces_rn_2 blockchain_tr_traces_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces_rn_2
    ADD CONSTRAINT blockchain_tr_traces_pkey PRIMARY KEY (id);


--
-- Name: blockchain_tr_traces blockchain_tr_traces_rn_external_id_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces
    ADD CONSTRAINT blockchain_tr_traces_rn_external_id_key UNIQUE (external_id);


--
-- Name: blockchain_tr_traces blockchain_tr_traces_rn_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces
    ADD CONSTRAINT blockchain_tr_traces_rn_pkey PRIMARY KEY (id);


--
-- Name: blockchain_tr_traces blockchain_tr_traces_rn_tr_id_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces
    ADD CONSTRAINT blockchain_tr_traces_rn_tr_id_key UNIQUE (tr_id);


--
-- Name: blockchain_tr_traces_rn_2 blockchain_tr_traces_tr_id_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.blockchain_tr_traces_rn_2
    ADD CONSTRAINT blockchain_tr_traces_tr_id_key UNIQUE (tr_id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: entity_event_param entity_event_param_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_event_param
    ADD CONSTRAINT entity_event_param_pkey PRIMARY KEY (id);


--
-- Name: entity_notifications entity_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_notifications
    ADD CONSTRAINT entity_notifications_pkey PRIMARY KEY (id);


--
-- Name: entity_sources entity_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_sources
    ADD CONSTRAINT entity_sources_pkey PRIMARY KEY (id);


--
-- Name: entity_state_log entity_state_log_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_state_log
    ADD CONSTRAINT entity_state_log_pkey PRIMARY KEY (id);


--
-- Name: entity_stats_current entity_stats_current_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_stats_current
    ADD CONSTRAINT entity_stats_current_pkey PRIMARY KEY (id);


--
-- Name: entity_tags entity_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_tags
    ADD CONSTRAINT entity_tags_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_email_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_email_key UNIQUE (email);


--
-- Name: organizations organizations_nickname_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_nickname_key UNIQUE (nickname);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: post_ipfs_meta post_ipfs_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_ipfs_meta
    ADD CONSTRAINT post_ipfs_meta_pkey PRIMARY KEY (id);


--
-- Name: post_offer post_offer_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_offer
    ADD CONSTRAINT post_offer_pkey PRIMARY KEY (id);


--
-- Name: post_stats post_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_stats
    ADD CONSTRAINT post_stats_pkey PRIMARY KEY (id);


--
-- Name: post_stats post_stats_post_id_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_stats
    ADD CONSTRAINT post_stats_post_id_key UNIQUE (post_id);


--
-- Name: post_users_team post_users_team_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_users_team
    ADD CONSTRAINT post_users_team_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_title_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_title_key UNIQUE (title);


--
-- Name: Users unique_owner_public_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT unique_owner_public_key UNIQUE (owner_public_key);


--
-- Name: Users unique_private_key; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT unique_private_key UNIQUE (private_key);


--
-- Name: entity_tags unique_tag_title_entity_id_entity_name; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_tags
    ADD CONSTRAINT unique_tag_title_entity_id_entity_name UNIQUE (tag_title, entity_id, entity_name);


--
-- Name: users_activity users_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_activity
    ADD CONSTRAINT users_activity_pkey PRIMARY KEY (id);


--
-- Name: users_education users_education_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_education
    ADD CONSTRAINT users_education_pkey PRIMARY KEY (id);


--
-- Name: users_jobs users_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_jobs
    ADD CONSTRAINT users_jobs_pkey PRIMARY KEY (id);


--
-- Name: users_sources users_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_sources
    ADD CONSTRAINT users_sources_pkey PRIMARY KEY (id);


--
-- Name: users_team users_team_pkey; Type: CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_team
    ADD CONSTRAINT users_team_pkey PRIMARY KEY (id);


--
-- Name: account_name_from_idx; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX account_name_from_idx ON public.blockchain_tr_traces_rn_2 USING btree (account_name_from);


--
-- Name: account_name_from_rn_idx; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX account_name_from_rn_idx ON public.blockchain_tr_traces USING btree (account_name_from);


--
-- Name: account_name_to_idx; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX account_name_to_idx ON public.blockchain_tr_traces_rn_2 USING btree (account_name_to);


--
-- Name: account_name_to_rn_idx; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX account_name_to_rn_idx ON public.blockchain_tr_traces USING btree (account_name_to);


--
-- Name: entity_event_param_created_at_idx; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX entity_event_param_created_at_idx ON public.entity_event_param USING btree (created_at DESC);


--
-- Name: entity_id_entity_name_idx; Type: INDEX; Schema: public; Owner: uos
--

CREATE UNIQUE INDEX entity_id_entity_name_idx ON public.entity_stats_current USING btree (entity_id, entity_name);


--
-- Name: idx_users_activity_agi_uif_eit_en; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX idx_users_activity_agi_uif_eit_en ON public.users_activity USING btree (activity_group_id, user_id_from, entity_id_to, entity_name);


--
-- Name: tr_type; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX tr_type ON public.blockchain_tr_traces_rn_2 USING btree (account_name_from);


--
-- Name: tr_type_rn; Type: INDEX; Schema: public; Owner: uos
--

CREATE INDEX tr_type_rn ON public.blockchain_tr_traces USING btree (account_name_from);


--
-- Name: activity_user_comment activity_user_comment_comment_id_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_comment
    ADD CONSTRAINT activity_user_comment_comment_id_to_fkey FOREIGN KEY (comment_id_to) REFERENCES public.comments(id);


--
-- Name: activity_user_comment activity_user_comment_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_comment
    ADD CONSTRAINT activity_user_comment_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public."Users"(id);


--
-- Name: activity_user_post activity_user_post_post_id_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_post
    ADD CONSTRAINT activity_user_post_post_id_to_fkey FOREIGN KEY (post_id_to) REFERENCES public.posts(id);


--
-- Name: activity_user_post activity_user_post_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_post
    ADD CONSTRAINT activity_user_post_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public."Users"(id);


--
-- Name: activity_user_user activity_user_user_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_user
    ADD CONSTRAINT activity_user_user_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public."Users"(id);


--
-- Name: activity_user_user activity_user_user_user_id_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.activity_user_user
    ADD CONSTRAINT activity_user_user_user_id_to_fkey FOREIGN KEY (user_id_to) REFERENCES public."Users"(id);


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id);


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: entity_tags entity_tags_org_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_tags
    ADD CONSTRAINT entity_tags_org_id__fk FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: entity_tags entity_tags_tag_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_tags
    ADD CONSTRAINT entity_tags_tag_id__fk FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: entity_tags entity_tags_user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_tags
    ADD CONSTRAINT entity_tags_user_id__fk FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: posts fk_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.posts(id);


--
-- Name: entity_notifications fk_users_activity_id; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.entity_notifications
    ADD CONSTRAINT fk_users_activity_id FOREIGN KEY (users_activity_id) REFERENCES public.users_activity(id);


--
-- Name: organizations organizations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: post_ipfs_meta post_ipfs_meta_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_ipfs_meta
    ADD CONSTRAINT post_ipfs_meta_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: post_offer post_offer_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_offer
    ADD CONSTRAINT post_offer_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: post_stats post_stats_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_stats
    ADD CONSTRAINT post_stats_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: post_users_team post_users_team_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_users_team
    ADD CONSTRAINT post_users_team_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: post_users_team post_users_team_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.post_users_team
    ADD CONSTRAINT post_users_team_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: users_activity users_activity_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_activity
    ADD CONSTRAINT users_activity_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public."Users"(id);


--
-- Name: users_education users_education_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_education
    ADD CONSTRAINT users_education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: users_jobs users_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_jobs
    ADD CONSTRAINT users_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: users_sources users_sources_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_sources
    ADD CONSTRAINT users_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: users_team users_team_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: uos
--

ALTER TABLE ONLY public.users_team
    ADD CONSTRAINT users_team_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database cluster dump complete
--

