/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const isPreviewBuild = process.env.EAS_BUILD_PROFILE === 'preview';

  const plugins = config.plugins?.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
      return [
        'expo-build-properties',
        {
          ...plugin[1],
          android: {
            ...plugin[1]?.android,
            ...(isPreviewBuild ? { buildArchs: ['arm64-v8a'] } : {}),
          },
        },
      ];
    }
    return plugin;
  });

  return { ...config, plugins };
};
