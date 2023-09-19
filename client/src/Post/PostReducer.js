import { ADD_POST, ADD_POSTS, DELETE_POST, SET_LOADING } from './PostActions';

// Initial State
const initialState = { data: [], loading: false };

const PostReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_POST:
      if (action.post) {
        return {
          data: [action.post, ...state.data],
          loading: false
        };
      }
      return state


    case ADD_POSTS:
      return {
        data: action.posts,
        loading: false
      };

    case DELETE_POST:
      return {
        data: state.data.filter(post => post.cuid !== action.cuid),
        loading: false
      };
    case SET_LOADING: {
      return {
        ...state, loading: action.loading
      }
    }
    default:
      return state;
  }
};

/* Selectors */

// Get all posts
export const getPosts = state => state.posts.data;

// Get post by cuid
export const getPost = (state, cuid) => state.posts.data.filter(post => post.cuid === cuid)[0];

// Export Reducer
export default PostReducer;
