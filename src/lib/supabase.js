import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jkdjboxmtajkuxxecppo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DGuYcjDlLkVV237ItBtacw_8tX_N_eX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Save user/login information into Supabase (e.g. user_logins / profiles table, or localStorage fallback).
 */
export async function recordUserSession(userRecord) {
  try {
    const payload = {
      id: userRecord.id || `user_${Date.now()}`,
      email: userRecord.email || "guest@blueprint.studio",
      full_name: userRecord.user_metadata?.full_name || userRecord.full_name || "Guest User",
      role: userRecord.is_guest ? "guest" : "user",
      last_login: new Date().toISOString(),
      metadata: JSON.stringify(userRecord),
    };

    // Try inserting into profiles / user_logins table in Supabase
    const { data, error } = await supabase
      .from("user_logins")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Supabase user_logins table note:", error.message);
      // Fallback: try profiles table if user_logins isn't created
      await supabase.from("profiles").upsert({
        id: payload.id,
        email: payload.email,
        full_name: payload.full_name,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    }
    return data;
  } catch (err) {
    console.warn("Error recording user session in Supabase:", err);
  }
}

/**
 * Sign in existing user with email & password
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (data?.user) {
    await recordUserSession(data.user);
  }
  return data;
}

/**
 * Sign up new user with email, password and full name
 */
export async function signUpWithEmail(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
  if (data?.user) {
    await recordUserSession({ ...data.user, full_name: fullName });
  }
  return data;
}

/**
 * Login as Guest: Creates a guest session and records it in Supabase
 */
export async function loginAsGuestSession(customGuestName) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const guestEmail = `guest_${timestamp}_${randomStr}@blueprint.studio`;
  const guestPassword = `GuestPass_${timestamp}_!`;
  const guestName = customGuestName || `Guest Architect #${randomStr.toUpperCase()}`;

  let userObj = null;

  try {
    // Attempt real guest sign-up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        data: { full_name: guestName, is_guest: true },
      },
    });

    if (data?.user) {
      userObj = { ...data.user, is_guest: true, full_name: guestName, email: guestEmail };
    }
  } catch (err) {
    console.warn("Supabase guest auth fallback:", err);
  }

  if (!userObj) {
    userObj = {
      id: `guest_${timestamp}`,
      email: guestEmail,
      full_name: guestName,
      is_guest: true,
      created_at: new Date().toISOString(),
    };
  }

  // Save guest info to Supabase database
  await recordUserSession(userObj);
  return userObj;
}
