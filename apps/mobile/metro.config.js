const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer/expo",
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = withNativeWind(config, {
  input: "./src/styles/global.css",
  // Work around a Metro 0.83.x + react-native-css-interop 0.2.3
  // watcher crash by disabling virtual-module style fast refresh.
  // forceWriteFileSystem: true,
});
