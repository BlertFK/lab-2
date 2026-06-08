// src/model/services/__tests__/auth.service.test.js
// ─────────────────────────────────────────────
// Unit tests for the auth service — specifically the new password reset
// and email verification flows added to satisfy the project requirements.
// ─────────────────────────────────────────────

const mockAuth = { __mock: "auth", currentUser: null };

jest.mock("../../firebase/firebase.config", () => ({
  auth: mockAuth,
}));

const mockSendPasswordResetEmail = jest.fn(() => Promise.resolve());
const mockSendEmailVerification  = jest.fn(() => Promise.resolve());
const mockCreateUser             = jest.fn();
const mockUpdateProfile          = jest.fn(() => Promise.resolve());

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...a) => mockCreateUser(...a),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: (...a) => mockUpdateProfile(...a),
  updateEmail: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  signInWithCredential: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: (...a) => mockSendPasswordResetEmail(...a),
  sendEmailVerification: (...a) => mockSendEmailVerification(...a),
}));

const {
  registerWithEmail,
  sendPasswordReset,
  resendVerificationEmail,
} = require("../auth.service");

beforeEach(() => {
  mockSendPasswordResetEmail.mockClear();
  mockSendEmailVerification.mockClear();
  mockCreateUser.mockClear();
  mockUpdateProfile.mockClear();
  mockAuth.currentUser = null;
});

describe("sendPasswordReset", () => {
  it("forwards the email address to Firebase's sendPasswordResetEmail", async () => {
    await sendPasswordReset("blert@example.com");
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, "blert@example.com");
  });

  it("propagates Firebase errors so the viewmodel can surface them", async () => {
    mockSendPasswordResetEmail.mockRejectedValueOnce(
      Object.assign(new Error("user not found"), { code: "auth/user-not-found" })
    );
    await expect(sendPasswordReset("nope@x.com")).rejects.toThrow("user not found");
  });
});

describe("resendVerificationEmail", () => {
  it("throws when nobody is signed in", async () => {
    mockAuth.currentUser = null;
    await expect(resendVerificationEmail()).rejects.toThrow("Not signed in.");
  });

  it("throws when the current user's email is already verified", async () => {
    mockAuth.currentUser = { emailVerified: true };
    await expect(resendVerificationEmail()).rejects.toThrow(/already verified/);
  });

  it("calls Firebase's sendEmailVerification for the current user", async () => {
    const u = { emailVerified: false, email: "x@y.z" };
    mockAuth.currentUser = u;
    await resendVerificationEmail();
    expect(mockSendEmailVerification).toHaveBeenCalledWith(u);
  });
});

describe("registerWithEmail", () => {
  it("creates the account, sets the displayName, and fires a verification email", async () => {
    const fakeUser = { uid: "abc", emailVerified: false };
    mockCreateUser.mockResolvedValueOnce({ user: fakeUser });

    const result = await registerWithEmail("a@b.com", "secret123", "Alice Wonder");

    expect(mockCreateUser).toHaveBeenCalledWith(mockAuth, "a@b.com", "secret123");
    expect(mockUpdateProfile).toHaveBeenCalledWith(fakeUser, { displayName: "Alice Wonder" });
    expect(mockSendEmailVerification).toHaveBeenCalledWith(fakeUser);
    expect(result).toBe(fakeUser);
  });

  it("doesn't crash if sendEmailVerification rejects (best-effort)", async () => {
    const fakeUser = { uid: "abc" };
    mockCreateUser.mockResolvedValueOnce({ user: fakeUser });
    mockSendEmailVerification.mockRejectedValueOnce(new Error("network"));

    await expect(registerWithEmail("a@b.com", "secret", "")).resolves.toBe(fakeUser);
  });
});
