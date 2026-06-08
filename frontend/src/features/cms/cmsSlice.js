import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";

// ── Thunks ────────────────────────────────────────────────────
export const fetchPages = createAsyncThunk("cms/fetchPages", async (_, { rejectWithValue }) => {
  try {
    const data = await apiClient.get("/cms/pages");
    return data.pages;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchPage = createAsyncThunk("cms/fetchPage", async (id, { rejectWithValue }) => {
  try {
    const data = await apiClient.get(`/cms/pages/${id}`);
    return data.page;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const saveBlock = createAsyncThunk(
  "cms/saveBlock",
  async ({ blockId, contentJson }, { rejectWithValue }) => {
    try {
      const data = await apiClient.put(`/cms/blocks/${blockId}`, { content_json: contentJson });
      return data.block;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const publishBlock = createAsyncThunk(
  "cms/publishBlock",
  async (blockId, { rejectWithValue }) => {
    try {
      const data = await apiClient.post(`/cms/blocks/${blockId}/publish`);
      return data.block;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const publishPage = createAsyncThunk(
  "cms/publishPage",
  async (pageId, { rejectWithValue }) => {
    try {
      const data = await apiClient.post(`/cms/pages/${pageId}/publish`);
      return data.page;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────
const cmsSlice = createSlice({
  name: "cms",
  initialState: {
    pages: [],
    currentPage: null,
    selectedSectionId: null,
    selectedBlockId: null,
    editingBlockContent: null,
    loading: false,
    error: null,
    isDirty: false,
  },
  reducers: {
    selectSection(state, action) {
      state.selectedSectionId = action.payload;
      state.selectedBlockId = null;
      state.editingBlockContent = null;
    },
    selectBlock(state, action) {
      state.selectedBlockId = action.payload.blockId;
      state.editingBlockContent = action.payload.content;
      state.isDirty = false;
    },
    updateEditingContent(state, action) {
      state.editingBlockContent = action.payload;
      state.isDirty = true;
    },
    clearEditing(state) {
      state.selectedBlockId = null;
      state.editingBlockContent = null;
      state.isDirty = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPages.pending, (s) => { s.loading = true; })
      .addCase(fetchPages.fulfilled, (s, a) => { s.loading = false; s.pages = a.payload; })
      .addCase(fetchPages.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchPage.pending, (s) => { s.loading = true; })
      .addCase(fetchPage.fulfilled, (s, a) => { s.loading = false; s.currentPage = a.payload; })
      .addCase(fetchPage.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(saveBlock.fulfilled, (s) => { s.isDirty = false; })

      .addCase(publishPage.fulfilled, (s, a) => {
        const idx = s.pages.findIndex((p) => p.id === a.payload.id);
        if (idx >= 0) s.pages[idx] = a.payload;
        if (s.currentPage?.id === a.payload.id) s.currentPage = a.payload;
      });
  },
});

export const { selectSection, selectBlock, updateEditingContent, clearEditing, clearError } = cmsSlice.actions;
export default cmsSlice.reducer;
