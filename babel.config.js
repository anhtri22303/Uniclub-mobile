module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            [
                "module-resolver",
                {
                    root: ["./"],
                    alias: {
                        "@": "./src",
                        "@atoms": "./src/components/Atoms",
                        "@molecules": "./src/components/Molecules",
                        "@organisms": "./src/components/Organisms",
                        "@components": "./src/components",
                        "@configs": "./src/configs",
                        "@constants": "./src/constants",
                        "@screens": "./src/screens",
                        "@routes": "./src/routes",
                        "@services": "./src/services",
                        "@stores": "./src/stores",
                        "@types": "./src/types",
                        "@utils": "./src/utils",
                        "@hooks": "./src/hooks",
                        "@assets": "./assets",
                    },
                },
            ],
        ],
    };
};