// src/model/services/__tests__/favorites.service.test.js
// ─────────────────────────────────────────────
// Unit tests for the favorites service.
// Firebase is mocked — these tests assert that our service calls the
// right Firestore APIs with the right shape, and post-process snapshots
// correctly. They run fast and don't hit the network.
// ─────────────────────────────────────────────

jest.mock("../../firebase/firebase.config", () => ({
  db: { __mock: "firestore" },
  storage: { __mock: "storage" },
}));

const mockSetDoc      = jest.fn(() => Promise.resolve());
const mockDeleteDoc   = jest.fn(() => Promise.resolve());
const mockOnSnapshot  = jest.fn();
const mockServerTimestamp = jest.fn(() => "__SERVER_TS__");

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((db, name) => ({ __collection: name })),
  doc: jest.fn((db, collection, id) => ({ __collection: collection, __id: id })),
  query: jest.fn((coll, ...constraints) => ({ __coll: coll, __constraints: constraints })),
  where: jest.fn((field, op, value) => ({ __field: field, __op: op, __value: value })),
  setDoc: (...args) => mockSetDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

const {
  addFavorite,
  removeFavorite,
  subscribeToFavorites,
} = require("../favorites.service");

beforeEach(() => {
  mockSetDoc.mockClear();
  mockDeleteDoc.mockClear();
  mockOnSnapshot.mockClear();
});

describe("addFavorite", () => {
  it("writes a doc with id `${userId}_${listingId}` and the expected fields", async () => {
    const listing = {
      id: "list-1",
      title: "Sunny studio",
      price: 450,
      address: "Pristina, KS",
      city: "Pristina",
      category: "studio",
      imageURLs: ["https://example.com/a.jpg"],
      ownerId: "owner-1",
      ownerName: "Alice",
      latitude: 42.6629,
      longitude: 21.1655,
    };

    await addFavorite("user-1", listing);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [docRef, payload] = mockSetDoc.mock.calls[0];
    expect(docRef.__id).toBe("user-1_list-1");

    expect(payload).toMatchObject({
      userId: "user-1",
      listingId: "list-1",
      title: "Sunny studio",
      price: 450,
      city: "Pristina",
      category: "studio",
      ownerId: "owner-1",
    });
    expect(payload.favoritedAt).toBe("__SERVER_TS__");
  });

  it("falls back to listing.listingId when listing.id is missing", async () => {
    await addFavorite("u-2", { listingId: "fallback-id", title: "X" });
    expect(mockSetDoc.mock.calls[0][0].__id).toBe("u-2_fallback-id");
  });

  it("defaults category to 'other' when not provided", async () => {
    await addFavorite("u-3", { id: "L", title: "Y" });
    expect(mockSetDoc.mock.calls[0][1].category).toBe("other");
  });
});

describe("removeFavorite", () => {
  it("deletes the doc at favorites/`${userId}_${listingId}`", async () => {
    await removeFavorite("user-1", "list-1");
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockDeleteDoc.mock.calls[0][0].__id).toBe("user-1_list-1");
  });
});

describe("subscribeToFavorites", () => {
  it("queries favorites filtered by userId and sorts results newest-first", () => {
    // Simulate Firestore handing us 3 docs out of order.
    const onData = jest.fn();
    mockOnSnapshot.mockImplementationOnce((q, success) => {
      success({
        docs: [
          { id: "a", data: () => ({ favoritedAt: { toMillis: () => 100 }, title: "Oldest" }) },
          { id: "b", data: () => ({ favoritedAt: { toMillis: () => 300 }, title: "Newest" }) },
          { id: "c", data: () => ({ favoritedAt: { toMillis: () => 200 }, title: "Middle" }) },
        ],
      });
      return jest.fn(); // unsubscribe
    });

    subscribeToFavorites("user-1", onData, jest.fn());

    expect(onData).toHaveBeenCalledTimes(1);
    const sorted = onData.mock.calls[0][0];
    expect(sorted.map((x) => x.title)).toEqual(["Newest", "Middle", "Oldest"]);
  });

  it("returns the unsubscribe function from Firestore", () => {
    const unsubscribeSpy = jest.fn();
    mockOnSnapshot.mockImplementationOnce(() => unsubscribeSpy);

    const off = subscribeToFavorites("u", jest.fn(), jest.fn());
    expect(off).toBe(unsubscribeSpy);
  });
});
