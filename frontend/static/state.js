export const appState = {
    posts_offset: 0,
    posts_limit: 10,
    categoriesData: [],
    isFetching: false,
    noMorePosts: false,
    currentUser: null
    // other properties
};

export function resetAll() {
    appState.posts_offset = 0
    appState.isFetching = false
    appState.noMorePosts = false
    appState.categoriesData = []
    appState.currentUser = null
}