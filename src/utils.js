import { get } from 'lodash';

export function addFetchTimeToResolver(resolver, fetchTime, mockResolver) {
  const priorityFetTime = get(mockResolver, "fetchDelay");
  return () =>
    resolver().then(
      (response) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(response);
          }, priorityFetTime || fetchTime);
        })
    );
}

export function createApiResolver(requestConfig, resolver, defaultConfig) {
  if (resolver) {
    const resolverMethod =
      typeof resolver === "function" ? resolver : resolver.handler;
    const { enabled } =
      typeof resolver === "function"
        ? defaultConfig
        : { ...defaultConfig, ...resolver };
    if (enabled) {
      return async () => {
        let response;
        await resolverMethod(requestConfig, {
          send: (res) => {
            response = res;
          },
        });
        return Promise.resolve(response);
      };
    }
  }
  console.log("contact axios");
  return () => Promise.resolve();
}

export function createCacheResolver(cache, requestConfig) {
  if (requestConfig.cacheKey) {
    return () => {
      const cacheData = get(cache, requestConfig.cacheKey, null);
      if (cacheData) {
        return Promise.resolve({
          ...cacheData,
          data: Object.values(cacheData.data),
        });
      }
    };
  }
}

export function createRequestConfig(reqMethod, path, body, config, params) {
  const cacheKey = get(config, "cacheKey", null);
  const onResponseReceived = get(config, "onResponseReceived", null);
  return {
    method: reqMethod,
    path,
    cacheKey,
    body,
    onResponseReceived,
    params,
  };
}

export function reduceArrayItemToObject(result, item) {
  return {
    ...(result || {}),
    [item.id]: item,
  };
}
