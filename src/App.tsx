import { useEffect, useRef, useState } from "react";
import "./App.css";

interface SearchResult {
  year: string;
  subtype: string;
  title: string;
  subtitle: string;
  link: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  format?: string;
  data?: SearchResult[];
}

export function App() {
  const [inputValue, setInputValue] = useState("");
  const [searchSource, setSearchSource] = useState("douban");
  const [showSearchSource, setShowSearchSource] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [output, setOutput] = useState("");
  const [showGenHelp, setShowGenHelp] = useState(false);
  const [showGenOut, setShowGenOut] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Handle input change to show/hide search source selector
    if (/^http/.test(inputValue) || inputValue === "") {
      setShowSearchSource(false);
    } else {
      setShowSearchSource(true);
    }
  }, [inputValue]);

  // 加载访问统计脚本
  useEffect(() => {
    const loadScript = (src: string) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
      return script;
    };

    const busuanziScript = loadScript("//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js");

    return () => {
      // 清理函数，组件卸载时移除脚本
      if (busuanziScript) {
        document.body.removeChild(busuanziScript);
      }
    };
  }, []);

  const handleCopyClick = () => {
    if (textareaRef.current) {
      textareaRef.current.select();

      try {
        // 尝试使用新的Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textareaRef.current.value);
        } else {
          // 回退到旧的execCommand方法
          document.execCommand("copy");
        }
        alert("已复制到剪贴板！");
      } catch (err) {
        console.error("复制失败:", err);
        alert("复制失败，请手动复制。");
      }
    }
  };

  const handleSubmit = async () => {
    setIsQuerying(true);

    const baseParams: Record<string, string> = {};
    const apikey = localStorage.getItem("APIKEY");
    if (apikey) {
      baseParams.apikey = apikey;
    }

    try {
      if (inputValue.length === 0) {
        alert("空字符，请检查输入");
        setIsQuerying(false);
        return;
      }

      if (/^http/.test(inputValue)) {
        setShowGenHelp(false);
        setShowGenOut(true);

        const params = new URLSearchParams({
          ...baseParams,
          url: inputValue,
        });

        const response = await fetch(`api/gen?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        });

        if (!response.ok) {
          if (response.status === 403) {
            const newApikey = prompt("请在输入apikey后重试");
            if (newApikey) localStorage.setItem("APIKEY", newApikey);
          } else if (response.status === 429) {
            alert("Met Rate Limit, Retry later~");
          } else {
            alert("Error occurred!");
          }
          setIsQuerying(false);
          return;
        }

        const data: ApiResponse = await response.json();
        setOutput(data.success === false && data.error ? data.error : data.format || "");
      } else {
        setShowGenHelp(true);
        setShowGenOut(false);

        const params = new URLSearchParams({
          ...baseParams,
          search: inputValue,
          source: searchSource,
        });

        const response = await fetch(`api/gen?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        });

        if (!response.ok) {
          if (response.status === 403) {
            const newApikey = prompt("请在输入apikey后重试");
            if (newApikey) localStorage.setItem("APIKEY", newApikey);
          } else if (response.status === 429) {
            alert("Met Rate Limit, Retry later~");
          } else {
            alert("Error occurred!");
          }
          setIsQuerying(false);
          return;
        }

        const data: ApiResponse = await response.json();
        if (data.success === false) {
          alert(data.error);
        } else if (data.data && Array.isArray(data.data)) {
          setSearchResults(data.data);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while processing your request.");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleResultClick = (url: string) => {
    setInputValue(url);
    setShowSearchSource(false);
    handleSubmit();
  };

  // 为了避免复杂的JSX嵌套，提前渲染子标题部分
  const renderSubtitle = (item: SearchResult) => {
    if (item.subtitle && item.subtitle !== item.title) {
      return (
        <>
          <br />
          {item.subtitle}
        </>
      );
    }
    return null;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-[#222] text-white z-10 h-[50px] flex items-center">
        <div className="container-fluid mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="navbar-header">
              <a className="text-white text-lg font-bold no-underline" href="#">
                PT Gen
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid pt-[70px] px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center mb-4">
            <div className="grow">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="名称或豆瓣、IMDb、Bangumi、Steam、indienova、Epic等资源链接"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ width: showSearchSource ? "460px" : "480px" }}
              />
            </div>

            {showSearchSource && (
              <div className="mx-2">
                <select
                  className="border border-gray-300 rounded px-3 py-2"
                  value={searchSource}
                  onChange={(e) => setSearchSource(e.target.value)}
                >
                  <option value="douban">豆瓣</option>
                  <option value="imdb">IMDb</option>
                  <option value="bangumi">Bangumi</option>
                </select>
              </div>
            )}

            <button
              className="ml-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleSubmit}
              disabled={isQuerying}
            >
              {isQuerying ? "查询中" : showSearchSource ? "搜索" : "查询"}
            </button>
          </div>

          <hr className="my-6" />

          {showGenHelp && (
            <div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">年代</th>
                    <th className="border px-4 py-2 text-left">类别</th>
                    <th className="border px-4 py-2 text-left">标题</th>
                    <th className="border px-4 py-2 text-left">资源链接</th>
                    <th className="border px-4 py-2 text-left">行为</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border px-4 py-2">{item.year}</td>
                      <td className="border px-4 py-2">{item.subtype}</td>
                      <td className="border px-4 py-2">
                        {item.title}
                        {renderSubtitle(item)}
                      </td>
                      <td className="border px-4 py-2">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {item.link}
                        </a>
                      </td>
                      <td className="border px-4 py-2">
                        <button className="text-blue-500 hover:underline" onClick={() => handleResultClick(item.link)}>
                          选择
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showGenOut && (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                  className="bg-white border border-gray-300 text-gray-600 px-2 py-1 text-sm rounded"
                  onClick={handleCopyClick}
                >
                  复制
                </button>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full border border-gray-300 rounded p-3"
                rows={22}
                value={output}
                readOnly
              />
            </div>
          )}

          <hr className="my-6" />

          <div>
            <h4 className="text-xl font-medium mb-2">相关替代</h4>
            <p>
              此处列出可以替代本平台的其他应用，以便在 <code className="bg-gray-100 px-1 py-0.5 rounded">Pt-Gen</code>{" "}
              失效或返回数据陈旧时使用
            </p>
            <ul className="mt-4 list-disc pl-5">
              <li className="mb-1">
                <b>
                  <a
                    href="https://github.com/Rhilip/pt-gen-cfworker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Rhilip/pt-gen-cfworker
                  </a>
                </b>
                ：构建在Cloudflare Worker上的Pt-Gen分支
              </li>
              <li className="mb-1">
                <b>
                  <a
                    href="https://github.com/BFDZ/PT-Gen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    BFDZ/Pt-Gen
                  </a>
                </b>{" "}
                :
                <a
                  href="https://www.bfdz.ink/tools/ptgen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  https://www.bfdz.ink/tools/ptgen
                </a>{" "}
                , 公开维护的Pt-Gen独立分支
              </li>
              <li className="mb-1">
                豆瓣：{" "}
                <a
                  href="https://greasyfork.org/en/scripts/38878"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  电影信息查询脚本
                </a>{" "}
                或{" "}
                <a
                  href="https://greasyfork.org/scripts/329484"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  豆瓣资源下载大师
                </a>
              </li>
              <li className="mb-1">
                Bangumi： Bangumi Info Export{" "}
                <a
                  href="https://git.io/fjm3l"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  脚本
                </a>
                ，
                <a
                  href="https://bgm.tv/dev/app/103"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  应用平台
                </a>
              </li>
            </ul>
          </div>

          <div className="hidden">
            <span id="busuanzi_container_site_pv">
              本站总访问量<span id="busuanzi_value_site_pv"></span>次
            </span>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#222] text-white z-10 h-[50px] flex items-center">
        <div className="flex gap-4 ml-auto mr-4">
          <a
            className="text-white no-underline hover:underline"
            href="//github.com/kuusei/pt-gen-react"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            className="text-white no-underline hover:underline"
            href="//blog.rhilip.info"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered By @kuusei
          </a>
        </div>
      </nav>
    </>
  );
}

export default App;
