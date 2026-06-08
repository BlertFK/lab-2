import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFetch } from "../../utils/api";

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const fetchProperties = createAsyncThunk(
  "properties/fetchProperties",
  async (params = {}) => {
    const data = await apiFetch(`/properties${buildQueryString(params)}`);
    return data.properties || [];
  }
);

export const fetchPropertyById = createAsyncThunk(
  "properties/fetchPropertyById",
  async (id) => {
    const data = await apiFetch(`/properties/${id}`);
    return data.property;
  }
);

export const createProperty = createAsyncThunk(
  "properties/createProperty",
  async (property) => {
    const data = await apiFetch("/properties", {
      method: "POST",
      body: JSON.stringify(property),
    });
    return data.property;
  }
);

export const updateProperty = createAsyncThunk(
  "properties/updateProperty",
  async ({ id, changes, property }) => {
    const data = await apiFetch(`/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes || property || {}),
    });
    return data.property;
  }
);

export const deleteProperty = createAsyncThunk(
  "properties/deleteProperty",
  async (id) => {
    await apiFetch(`/properties/${id}`, { method: "DELETE" });
    return id;
  }
);

export const trackPropertyView = createAsyncThunk(
  "properties/trackPropertyView",
  async (payload) => {
    const id = typeof payload === "object" ? payload.id : payload;
    const source = typeof payload === "object" ? payload.source : undefined;
    const data = await apiFetch(`/properties/${id}/track-view`, {
      method: "POST",
      body: JSON.stringify({ source: source || "frontend" }),
    });
    return data.property;
  }
);

const initialState = {
  items: [],
  selected: null,
  loading: false,
  selectedLoading: false,
  saving: false,
  deleting: false,
  tracking: false,
  error: null,
};

const upsertProperty = (items, property) => {
  if (!property) return items;
  const index = items.findIndex((item) => item.id === property.id);
  if (index === -1) return [property, ...items];
  return items.map((item) => (item.id === property.id ? property : item));
};

const propertiesSlice = createSlice({
  name: "properties",
  initialState,
  reducers: {
    clearSelectedProperty(state) {
      state.selected = null;
      state.error = null;
    },
    clearPropertiesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch properties.";
      })
      .addCase(fetchPropertyById.pending, (state) => {
        state.selectedLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
        state.items = upsertProperty(state.items, action.payload);
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.error = action.error.message || "Failed to fetch property.";
      })
      .addCase(createProperty.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.saving = false;
        state.selected = action.payload;
        state.items = upsertProperty(state.items, action.payload);
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || "Failed to create property.";
      })
      .addCase(updateProperty.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.saving = false;
        state.selected = action.payload;
        state.items = upsertProperty(state.items, action.payload);
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || "Failed to update property.";
      })
      .addCase(deleteProperty.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((property) => property.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.error.message || "Failed to delete property.";
      })
      .addCase(trackPropertyView.pending, (state) => {
        state.tracking = true;
      })
      .addCase(trackPropertyView.fulfilled, (state, action) => {
        state.tracking = false;
        state.selected = action.payload || state.selected;
        state.items = upsertProperty(state.items, action.payload);
      })
      .addCase(trackPropertyView.rejected, (state, action) => {
        state.tracking = false;
        state.error = action.error.message || "Failed to track property view.";
      });
  },
});

export const { clearSelectedProperty, clearPropertiesError } = propertiesSlice.actions;

export const selectProperties = (state) => state.properties.items;
export const selectSelectedProperty = (state) => state.properties.selected;
export const selectPropertiesLoading = (state) => state.properties.loading;
export const selectPropertyLoading = (state) => state.properties.selectedLoading;
export const selectPropertiesError = (state) => state.properties.error;

export default propertiesSlice.reducer;
