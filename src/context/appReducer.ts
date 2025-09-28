import type { AppState, AppAction } from '../types';

export const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    token: null,
    user: null,
  },
  repositories: [],
  selectedRepository: null,
  pullRequests: [],
  selectedPR: null,
  reviewComments: [],
  templates: [],
  ui: {
    loading: false,
    error: null,
    currentView: 'repos',
    isReviewRunning: false,
  },
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
        },
      };

    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentView: action.payload,
        },
      };

    case 'SET_REVIEW_RUNNING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isReviewRunning: action.payload,
        },
      };

    case 'SET_AUTH':
      return {
        ...state,
        auth: {
          ...state.auth,
          ...action.payload,
        },
      };

    case 'SET_REPOSITORIES':
      return {
        ...state,
        repositories: action.payload,
      };

    case 'SELECT_REPOSITORY':
      return {
        ...state,
        selectedRepository: action.payload,
        // Clear PR-related state when selecting a new repository
        pullRequests: [],
        selectedPR: null,
        reviewComments: [],
      };

    case 'SET_PULL_REQUESTS':
      return {
        ...state,
        pullRequests: action.payload,
      };

    case 'SELECT_PULL_REQUEST':
      return {
        ...state,
        selectedPR: action.payload,
        // Clear review comments when selecting a new PR
        reviewComments: [],
      };

    case 'SET_REVIEW_COMMENTS':
      return {
        ...state,
        reviewComments: action.payload,
      };

    case 'UPDATE_COMMENT':
      return {
        ...state,
        reviewComments: state.reviewComments.map(comment =>
          comment.id === action.payload.id
            ? { ...comment, ...action.payload.updates }
            : comment
        ),
      };

    case 'DELETE_COMMENT':
      return {
        ...state,
        reviewComments: state.reviewComments.filter(
          comment => comment.id !== action.payload
        ),
      };

    case 'SET_TEMPLATES':
      return {
        ...state,
        templates: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};