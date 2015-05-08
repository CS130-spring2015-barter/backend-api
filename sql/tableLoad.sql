CREATE TABLE IF NOT EXISTS users (
	id serial PRIMARY KEY,

	first_name varchar(60) NOT NULL,
	last_name varchar(60) NOT NULL,

	email varchar(254) UNIQUE NOT NULL,
	hashed_pass varchar(60) NOT NULL,
	latitude float NOT NULL,
	longitude float NOT NULL,
	about_me TEXT,
	user_image BYTEA,

	reset_password_token varchar(40),
	reset_token_expires timestamp with time zone DEFAULT now() + interval '1 hour',

	last_logged_on timestamp with time zone DEFAULT now(),
	last_password_change timestamp with time zone,
	date_created timestamp with time zone
);

CREATE TABLE IF NOT EXISTS items (
	id serial PRIMARY KEY,
	user_id int REFERENCES users(id),
	
	item_description TEXT NOT NULL,
	item_title varchar(100) NOT NULL,
	item_image BYTEA NOT NULL
);

CREATE TABLE IF NOT EXISTS seenItems (

	id serial PRIMARY KEY,

	user_id int REFERENCES users(id) ON DELETE CASCADE,
	item_id int REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likedItems (

	id serial PRIMARY KEY,

	user_id int REFERENCES users(id) ON DELETE CASCADE,
	item_id int REFERENCES items(id) ON DELETE CASCADE
);

