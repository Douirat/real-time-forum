export const appState = {
    posts_offset: 0,
    posts_limit: 10,
    users_offset: 0,
    users_limit: 20,
    chat_offset: 0,
    chat_limit:20,
    categoriesData: [],
    is_fetching_users: false,
    is_fetching_posts: false,
    is_fetching_messages: false,
    noMorePosts: false,
    chat_user: null,
    app_user: null
};

export function resetAppState() {
  appState.posts_offset = 0;
  appState.posts_limit = 10;
  appState.users_offset = 0;
  appState.users_limit = 20;
  appState.chat_offset = 0;
  appState.chat_limit = 20;
  appState.categoriesData = [];
  appState.is_fetching_users = false;
  appState.is_fetching_posts = false;
  appState.is_fetching_messages = false;
  appState.noMorePosts = false;
  appState.chat_user = null;
  appState.app_user = null;
}
