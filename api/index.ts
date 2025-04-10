export { support_list } from "./config/domain";
import { support_list } from "./config/domain";

import {
  AUTHOR,
  debug_get_err,
  gen_bangumi,
  gen_douban,
  gen_epic,
  gen_imdb,
  gen_indienova,
  gen_steam,
  makeJsonResponse,
  search_bangumi,
  search_douban,
  search_imdb,
} from "./lib";

/**
 * Cloudflare Worker entrypoint
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/gen")) {
      return await handleApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

/**
 * 处理API请求
 */
async function handleApiRequest(
  request: Request<unknown, IncomingRequestCfProperties<unknown>>,
  env: Env
): Promise<Response> {
  // 处理OPTIONS
  if (request.method === "OPTIONS") {
    return handleOptions(request);
  }

  // 检查缓存，命中则直接返回ø
  const cache = caches.default; // 定义缓存
  let response = await cache.match(request);

  if (!response) {
    // 未命中缓存
    // 使用URI() 解析request.url
    const uri = new URL(request.url);

    try {
      let cache_key;

      // if (env.APIKEY && uri.searchParams.get("apikey") !== env.APIKEY) {
      //   return makeJsonRawResponse(
      //     {
      //       error: "apikey required.",
      //     },
      //     { status: 403 }
      //   );
      // }

      let response_data;
      // 处理搜索请求
      if (uri.searchParams.get("search")) {
        // 搜索类（通过PT-Gen代理）
        const keywords = uri.searchParams.get("search");
        const source = uri.searchParams.get("source") || "douban";

        if (support_site_list.includes(source)) {
          if (source === "douban") {
            response_data = await search_douban(keywords);
          } else if (source === "imdb") {
            response_data = await search_imdb(keywords);
          } else if (source === "bangumi") {
            response_data = await search_bangumi(keywords);
          } else {
            // 没有对应方法搜索的资源站点
            response_data = { error: "Miss search function for `source`: " + source + "." };
          }
        } else {
          response_data = { error: "Unknown value of key `source`." };
        }
      } else {
        // 内容生成类
        let site, sid;

        // 请求字段 `&url=` 存在
        const url_ = uri.searchParams.get("url");
        if (url_) {
          for (const site_ in support_list) {
            const pattern = support_list[site_ as keyof typeof support_list];
            if (url_.match(pattern)) {
              site = site_;
              sid = url_.match(pattern)?.[1];
              break;
            }
          }
        } else {
          site = uri.searchParams.get("site");
          sid = uri.searchParams.get("sid");
        }

        // 如果site和sid不存在的话，提前返回
        if (site == null || sid == null) {
          response_data = { error: "Miss key of `site` or `sid` , or input unsupported resource `url`." };
        } else {
          if (support_site_list.includes(site)) {
            if (site === "douban") {
              response_data = await gen_douban(sid);
            } else if (site === "imdb") {
              response_data = await gen_imdb(sid);
            } else if (site === "bangumi") {
              response_data = await gen_bangumi(sid);
            } else if (site === "steam") {
              response_data = await gen_steam(sid);
            } else if (site === "indienova") {
              response_data = await gen_indienova(sid);
            } else if (site === "epic") {
              response_data = await gen_epic(sid);
            } else {
              response_data = { error: "Miss generate function for `site`: " + site + "." };
            }
          } else {
            response_data = { error: "Unknown value of key `site`." };
          }
        }
      }

      if (response_data) {
        response = makeJsonResponse(response_data);

        if (env.PT_GEN_STORE && typeof response_data.error === "undefined" && cache_key) {
          await env.PT_GEN_STORE.put(cache_key, JSON.stringify(response_data), { expirationTtl: 86400 * 2 });
        }

        if (request.method === "GET" && response) {
          await cache.put(request, response.clone());
        }
      }

      if (!response) {
        response = makeJsonResponse({ error: "Unknown error." });
      }

      return response as Response;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const err_return = {
        error: `Internal Error, Please contact @${AUTHOR}. Exception: ${e?.message}`,
        debug: uri.searchParams.get("debug") === "1" ? debug_get_err(e, request) : undefined,
      };

      response = makeJsonResponse(err_return);

      return response as Response;
    }
  }

  return response;
}

const support_site_list = Object.keys(support_list);

//-    辅助方法      -//
function handleOptions(request: Request<unknown, IncomingRequestCfProperties<unknown>>) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    // Handle CORS pre-flight request.
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
        "Access-Control-Allow-Headers":
          "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers",
      },
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, OPTIONS",
      },
    });
  }
}
