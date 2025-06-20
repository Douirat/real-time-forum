export const appState = {
    posts_offset: 0,
    posts_limit: 10,
    categoriesData: [],
    isFetching: false,        // ✅ Add this
    noMorePosts: false,       // ✅ Add this
    // ... other properties
};

export function resetAll() {
    appState.posts_offset = 0;
    appState.isFetching = false;
    appState.noMorePosts = false;
    appState.categoriesData = []
}