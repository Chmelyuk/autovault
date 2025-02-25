module.exports = function override(config) {
  console.log("Original rules:", config.module.rules); // Для отладки

  config.module.rules = config.module.rules.map(rule => {
    // Проверяем, является ли это правилом для source-map-loader
    if (rule.loader && rule.loader.includes('source-map-loader')) {
      console.log("Modifying source-map-loader rule:", rule); // Для отладки
      return {
        ...rule,
        exclude: [/node_modules/, /@babel(?:\/|\\{1,2})runtime/], // Добавляем исключение для node_modules
      };
    }
    return rule;
  });

  console.log("Modified rules:", config.module.rules); // Для отладки
  return config;
};