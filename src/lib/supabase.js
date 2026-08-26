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

    console.log("Saving user session to Supabase project (https://jkdjboxmtajkuxxecppo.supabase.co):", payload);

    // Try inserting into user_logins table
    const { data, error } = await supabase
      .from("user_logins")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Note when saving to 'user_logins' table:", error.message);
      // Fallback: try profiles table if user_logins isn't created
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: payload.id,
        email: payload.email,
        full_name: payload.full_name,
        updated_at: new Date().toISOString(),
      });
      if (profErr) {
        console.warn("Note when saving to 'profiles' table:", profErr.message);
        console.info("💡 TIP: Create the 'user_logins' table in Supabase SQL Editor to see records in Table Editor!");
      }
    } else {
      console.log("Successfully saved user session to Supabase database table!");
    }
    return data;
  } catch (err) {
    console.warn("Error recording user session in Supabase:", err);
  }
}

/**
 * Helper to get local accounts registry
 */
function getLocalAccounts() {
  try {
    const raw = localStorage.getItem("blueprint_registered_accounts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to save local accounts registry
 */
function saveLocalAccount(acc) {
  try {
    const list = getLocalAccounts().filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase());
    list.push(acc);
    localStorage.setItem("blueprint_registered_accounts", JSON.stringify(list));
  } catch (err) {
    console.warn("Error saving account locally:", err);
  }
}

/**
 * Sign in existing user with email & password
 */
export async function signInWithEmail(email, password) {
  const normEmail = email.trim().toLowerCase();

  // Try Supabase auth first
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password,
    });
    if (!error && data?.user) {
      await recordUserSession(data.user);
      return data;
    }
  } catch (err) {
    console.warn("Supabase Auth sign in check:", err.message);
  }

  // Fallback check in registered accounts registry
  const localAccounts = getLocalAccounts();
  const matchedAcc = localAccounts.find((a) => a.email.toLowerCase() === normEmail);

  if (matchedAcc) {
    if (matchedAcc.password === password) {
      const userObj = {
        id: matchedAcc.id,
        email: matchedAcc.email,
        full_name: matchedAcc.full_name,
        user_metadata: { full_name: matchedAcc.full_name },
        last_login: new Date().toISOString(),
      };
      await recordUserSession(userObj);
      return { user: userObj };
    } else {
      throw new Error("Invalid email or password. Please check your password.");
    }
  }

  throw new Error("No account found with this email address. Please create an account.");
}

/**
 * Sign up new user with email, password and full name
 */
export async function signUpWithEmail(email, password, fullName) {
  const normEmail = email.trim().toLowerCase();
  const accId = `usr_${Date.now()}`;

  // Store in registered accounts registry first so login always works
  saveLocalAccount({
    id: accId,
    email: normEmail,
    password,
    full_name: fullName,
    created_at: new Date().toISOString(),
  });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      console.warn("Supabase Auth signup notice:", error.message);
      const fallbackUser = {
        id: accId,
        email: normEmail,
        full_name: fullName,
        user_metadata: { full_name: fullName },
        created_at: new Date().toISOString(),
      };
      await recordUserSession(fallbackUser);
      return { user: fallbackUser, isFallback: true };
    }

    if (data?.user) {
      await recordUserSession({ ...data.user, full_name: fullName });
    }
    return data;
  } catch (err) {
    console.warn("Supabase signup fallback triggered:", err.message);
    const fallbackUser = {
      id: accId,
      email: normEmail,
      full_name: fullName,
      user_metadata: { full_name: fullName },
      created_at: new Date().toISOString(),
    };
    await recordUserSession(fallbackUser);
    return { user: fallbackUser, isFallback: true };
  }
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
