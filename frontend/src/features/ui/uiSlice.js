import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("theme") || "light";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: savedTheme,
    sidebarOpen: true,
    modalStack: [],
    globalLoading: false,
  },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.theme);
      document.documentElement.setAttribute("data-theme", state.theme);
    },
    setTheme(state, action) {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
      document.documentElement.setAttribute("data-theme", action.payload);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    pushModal(state, action) {
      state.modalStack.push(action.payload);
    },
    popModal(state) {
      state.modalStack.pop();
    },
    clearModals(state) {
      state.modalStack = [];
    },
    setGlobalLoading(state, action) {
      state.globalLoading = action.payload;
    },
  },
});

export const {
  toggleTheme, setTheme, toggleSidebar, setSidebarOpen,
  pushModal, popModal, clearModals, setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
