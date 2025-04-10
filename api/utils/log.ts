function getTime() {
  return new Date().toLocaleString("zh-CN", {
    hour12: false,
  });
}

export function log(message: string) {
  console.log(`[PTGen ${getTime()}]: ${message}`);
}
