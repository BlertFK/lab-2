// src/model/config/google-auth.config.js
// Google OAuth client IDs from Google Cloud Console.
//
// One Firebase project can use all three client IDs below:
// - Web client ID: used on web
// - iOS client ID: used in iOS development/production builds
// - Android client ID: used in Android development/production builds

export const GOOGLE_WEB_CLIENT_ID =
  "1090430376819-12rl7u444p2d9kh3grio60hpm8vrsqdb.apps.googleusercontent.com";

export const GOOGLE_IOS_CLIENT_ID =
  "1090430376819-7bgv96jl4ul8mk2fgplqmn8o8i8db5ig.apps.googleusercontent.com";

export const GOOGLE_ANDROID_CLIENT_ID =
  "PASTE_ANDROID_CLIENT_ID_HERE";

export const GOOGLE_AUTH_NATIVE_REDIRECT_URI =
  "com.fatkoou.roomly:/oauthredirect";
