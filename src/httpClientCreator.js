import { get as _get } from "lodash";
import { createEnhancer } from "./createEnhancer";
import {
  reduceArrayItemToObject,
  createRequestConfig,
  addFetchTimeToResolver,
  createApiResolver,
  createCacheResolver,
} from "./utils";

function createHttpClient() {
  const requestInterceptors = [];
  const responseInterceptors = [];
  let cache = {};
  let mockResolvers;
  let mockResolverConfig = { enabled: true, fetchDelay: 0 };

  const initialCache = localStorage.getItem("apiResultsCache");

  cache = initialCache ? JSON.parse(initialCache) : {};

  const { enhancer, onCacheUpdate } = createEnhancer(cache);

  function configure({ mockResolvers: _mockResolvers, fetchDelay }) {
    mockResolvers = _mockResolvers;
    mockResolverConfig = {
      ...mockResolverConfig,
      fetchDelay,
    };
  }

  function updateCacheInLS(newCache) {
    localStorage.setItem("apiResultsCache", JSON.stringify(newCache));
    onCacheUpdate(cache);
  }

  function setResponseToCache(cacheKey, response) {
    cache[cacheKey] = {
      ...response,
      data: response.data.reduce(reduceArrayItemToObject, {}),
    };
    updateCacheInLS(cache);
  }

  function onRequest(method) {
    requestInterceptors.push(method);
  }
  function onResponse(method) {
    responseInterceptors.push(method);
  }

  function notifyRequestInterceptors(value) {
    requestInterceptors.forEach((i) => {
      i(value);
    });
  }

  function notifyResponseInterceptors(data) {
    responseInterceptors.forEach((i) => {
      i(data);
    });
  }

  function getResponseMiddleware(requestConfig) {
    const { cacheKey, onResponseReceived } = requestConfig;
    return (response) => {
      if (cacheKey) {
        setResponseToCache(cacheKey, response);
      }
      if (onResponseReceived) {
        onResponseReceived({
          response,
          cache,
          req: requestConfig,
          setCache: (newCache) => {
            cache = newCache;
            updateCacheInLS(cache);
          },
        });
      }
      notifyResponseInterceptors({ requestConfig, response });
      return response;
    };
  }

  function getRequestHandler(method) {
    return (path, body, params, config) => {
      return new Promise((resolve, reject) => {
        const requestConfig = createRequestConfig(
          method,
          path,
          body,
          config,
          params
        );
        notifyRequestInterceptors(requestConfig);
        try {
          const resolver = _get(
            mockResolvers,
            `${requestConfig.method}:${requestConfig.path}`
          );
          const apiResolver = addFetchTimeToResolver(
            createApiResolver(requestConfig, resolver, mockResolverConfig),
            mockResolverConfig.fetchDelay,
            resolver
          );
          const cacheResolver = createCacheResolver(cache, requestConfig);
          setTimeout(() => {
            resolve({
              cacheResult: cacheResolver && cacheResolver(),
              apiResult: apiResolver().then(
                getResponseMiddleware(requestConfig)
              ),
            });
          }, 1000);
        } catch (error) {
          setTimeout(() => {
            reject(error);
          }, 1000);
        }
      });
    };
  }

  return {
    interceptors: { onRequest, onResponse },
    get: getRequestHandler("get"),
    post: getRequestHandler("post"),
    put: getRequestHandler("put"),
    delete: getRequestHandler("delete"),
    reduxDevEnhancer: enhancer,
    configure,
  };
}

export default createHttpClient();
