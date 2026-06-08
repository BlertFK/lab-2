import { configureStore } from "@reduxjs/toolkit";
import propertiesReducer from "../features/properties/propertiesSlice";
import cmsReducer from "../features/cms/cmsSlice"; // 👈 SHTO KËTË

export const store = configureStore({
  reducer: {
    properties: propertiesReducer,
    cms: cmsReducer,
  },
});

export default store;