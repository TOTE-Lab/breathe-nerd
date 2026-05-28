import express from "express";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { supabase } from "../db/supabaseClient.js";

const router = express.Router();

// userId comes from session, not request body — prevents user from spoofing their own id
router.get("/verify", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // grab the user id from the session cookie
    const userId = req.session.userId;

    // go to users table and find the row matching this id
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    // if no user found or error, they are not authenticated
    if (error || !user) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    // user is authenticated - send back their info
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// destroy session server-side before clearing cookie so the session can't be reused
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  try {
    // destroy the session on the server - makes it invalid immediately
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      // clear the session cookie from the browser
      // without this the browser keeps sending a dead session on next request
      res.clearCookie("connect.sid");

      return res.status(200).json({
        message: "Logged out",
      });
    });
  } catch (err) {
    next(err);
  }
});

router.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // pull name, email, password out of the request body
    const { email, password, name } = req.body;

    // all three fields are required - reject if any are missing
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "User must provide correct name, email and password",
      });
    }

    // check if an account with this email already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUserError) {
      return next(existingUserError);
    }

    // if a user already exists with this email, reject with 409 conflict
    if (existingUser) {
      return res.status(409).json({
        error: "An account with that email already exists",
      });
    }

    // hash the password before storing - never store plain text passwords
    // 10 is the salt rounds - higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert the new user into the database
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: hashedPassword,
        name,
      })
      .select("id, email, name")
      .single();

    // if insert failed, pass error to error handler
    if (insertError || !newUser) {
      return next(insertError);
    }

    // store the new user's id in the session so they are logged in immediately
    req.session.userId = newUser.id;

    // return the new user's info - 201 means something was created
    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // pull email and password out of the request body
    const { email, password } = req.body;

    // both fields are required - reject if either is missing
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // find the user in the database by email
    // select password_hash too so we can compare it below
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .single();

    // if no user found with this email, reject
    // use same error message as wrong password - dont reveal which one is wrong
    if (error || !user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // compare the plain text password against the stored hash
    // bcrypt handles this - returns true if they match
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    // if password is wrong, reject
    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // password is correct - update last_login timestamp in the database
    // only runs if password matched so failed attempts dont update this
    await supabase
      // go to the users table
      .from("users")
      // update the last_login column to right now
      .update({ last_login: new Date().toISOString() })
      // but only on the row where id matches this user's id
      .eq("id", user.id);

    // store the user's id in the session cookie so they stay logged in
    req.session.userId = user.id;

    // return the user's info - 200 means success
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;