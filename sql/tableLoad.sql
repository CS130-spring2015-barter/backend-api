CREATE TABLE IF NOT EXISTS users (
	id serial PRIMARY KEY,

	email varchar(254) UNIQUE NOT NULL,
	hashed_pass varchar(60) NOT NULL,

	reset_password_token varchar(40),
	reset_token_expires timestamp with time zone DEFAULT now() + interval '1 hour',

	last_logged_on timestamp with time zone DEFAULT now(),
	last_password_change timestamp with time zone,
	date_created timestamp with time zone
);
