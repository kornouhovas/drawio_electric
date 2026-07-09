window.EXPORT_URL = "/service/0";
window.DRAWIO_BASE_URL = window.location.origin;
window.DRAWIO_SERVER_URL = window.location.origin + "/";
window.DRAWIO_VIEWER_URL = "";
window.DRAWIO_LIGHTBOX_URL = "";
window.DRAW_MATH_URL = "math4/es5";
window.DRAWIO_ASSET_VERSION = "@ELECTRIC_ASSET_VERSION@";
window.DRAWIO_ASSET_URL = function(url) {
  var version = window.DRAWIO_ASSET_VERSION;

  if (version == null || version === "" || version.charAt(0) == "@") {
    return url;
  }

  try {
    var resolved = new URL(url, window.location.href);

    if (resolved.origin != window.location.origin) {
      return url;
    }

    resolved.searchParams.set("v", version);
    return resolved.href;
  } catch (e) {
    return url;
  }
};

(function() {
  var explicitUi = urlParams["ui"] != null;
  var skipThemeMigration = explicitUi || urlParams["embed"] == "1" || urlParams["lightbox"] == "1";
  var activeUi = explicitUi ? urlParams["ui"] : null;

  if (!skipThemeMigration) {
    try {
      var markerKey = ".drawio-electric-theme-v1";
      var configKey = ".drawio-config";
      var value = localStorage.getItem(configKey);
      var config = (value != null && value !== "") ? JSON.parse(value) : {};

      if (config == null || typeof config != "object") {
        config = {};
      }

      if (localStorage.getItem(markerKey) == null) {
        config.ui = "electric";
        localStorage.setItem(configKey, JSON.stringify(config));
        localStorage.setItem(markerKey, "1");
      }

      activeUi = config.ui;
    } catch (e) {
      window.uiTheme = window.uiTheme || "electric";
      activeUi = window.uiTheme;
    }
  }

  if (activeUi == "electric") {
    urlParams["ui"] = "electric";
    urlParams["local"] = "1";
    urlParams["splash"] = "0";

    if (urlParams["math"] == null) {
      urlParams["math"] = "0";
      window.ELECTRIC_LAZY_MATH = true;
    }
  }
})();

window.DRAWIO_CONFIG = {
  defaultCustomLibraries: [],
  enableCustomLibraries: false,
  appendCustomLibraries: false,
  expandLibraries: false
};

urlParams["sync"] = "manual";
urlParams["db"] = "0";
urlParams["gh"] = "0";
urlParams["tr"] = "0";
urlParams["gapi"] = "0";
urlParams["od"] = "0";
urlParams["gl"] = "0";
