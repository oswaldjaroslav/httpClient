function cacheReducer(cache, type, cachedData, cacheKey, item, params) {
  switch (type) {
    case "delete":
      return {
        ...cache,
        [cacheKey]: {
          data: Object.keys(cachedData.data).reduce((result, itemId) => {
            const item = cachedData.data[itemId];
            const newResults = {
              ...result,
            };
            if (params.id === item.id) {
              return newResults;
            }
            return {
              ...newResults,
              [item.id]: item,
            };
          }, {}),
        },
      };
    default:
      return {
        ...cache,
        [cacheKey]: {
          data: {
            ...cachedData.data,
            [item.id]: item,
          },
        },
      };
  }
}

export function createOneInManyCacheUpdater(cacheKey) {
  return ({ response, cache, setCache, req }) => {
    const cacheData = cache[cacheKey];
    const item = response.data;
    let newCache = cacheReducer(
      cache,
      req.method,
      cacheData,
      cacheKey,
      item,
      req.params
    );
    setCache(newCache);
  };
}
