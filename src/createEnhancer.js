import { combineReducers } from "redux";

function createReducer(staticReducers, asyncReducers) {
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
}

const CACHE_UPDATE = 'CACHE_UPDATE'; 

export function createEnhancer(initialCache = {}) {
  let dispatch;
  const enhancer = (staticReducers) => (createStore) => (...args) => {
    const store = createStore(...args);

    dispatch = store.dispatch;

    store.replaceReducer(
      createReducer(staticReducers, {
        apiCache: (state = initialCache, action) => {
          switch (action.type) {
            case CACHE_UPDATE:
              return action.payload;
            default:
              return state;
          }
        },
      })
    );

    return store;
  };
  return {
    enhancer,
    onCacheUpdate: (data) => {
      if (dispatch) {
        dispatch({
          type: CACHE_UPDATE,
          payload: data,
        });
      }
    },
  };
}
