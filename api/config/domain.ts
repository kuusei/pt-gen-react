// 注意value值中正则的分组只能有一个，而且必须是sid信息，其他分组必须设置不捕获属性
const support_list = {
  douban: /(?:https?:\/\/)?(?:(?:movie|www)\.)?douban\.com\/(?:subject|movie)\/(\d+)\/?/,
  imdb: /(?:https?:\/\/)?(?:www\.)?imdb\.com\/title\/(tt\d+)\/?/,
  bangumi: /(?:https?:\/\/)?(?:bgm\.tv|bangumi\.tv|chii\.in)\/subject\/(\d+)\/?/,
  steam: /(?:https?:\/\/)?(?:store\.)?steam(?:powered|community)\.com\/app\/(\d+)\/?/,
  indienova: /(?:https?:\/\/)?indienova\.com\/game\/(\S+)/,
  epic: /(?:https?:\/\/)?www\.epicgames\.com\/store\/[a-zA-Z-]+\/product\/(\S+)\/\S?/,
};

export { support_list };
