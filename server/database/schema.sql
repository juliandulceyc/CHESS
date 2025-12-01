-- Create the users table
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(50) UNIQUE NOT NULL,
	email VARCHAR (255) UNIQUE NOT NULL,
	password_hash VARCHAR (255) NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT  CURRENT_TIMESTAMP,
	last_login TIME_STAMP WITH TIME ZONE
);

-- Create the sessions table for connect-pg-simple
CREATE TABLE session (
	sid VARCHAR NOT NULL COLLATE "default",
	sess json NOT NULL, 
	expire timestamp(6) NOT NULL,
	CONSTRAINT session_pkey PRIMARY KEY (sid)
);

-- Create an index on the session table
CREATE INDEX IDX_session_expire ON session (expire);