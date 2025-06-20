// state.js

// Shared SPA state object
export const appState = {
  users_offset: 0,
  users_limit: 10,
  posts_offset: 0,
  posts_limit: 10,
  categoriesData: [],
};

// Reset only offsets (if you want partial reset)
export function resetOffsets() {
  appState.users_offset = 0;
  appState.posts_offset = 0;
}

// Full reset on logout
export function resetAll() {
  appState.users_offset = 0;
  appState.users_limit = 10;
  appState.posts_offset = 0;
  appState.posts_limit = 10;
  appState.categoriesData = [];
}
