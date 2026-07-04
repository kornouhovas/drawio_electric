(function() {
  try {
    var s = document.createElement("meta");
    s.setAttribute("content", "default-src 'self'; script-src 'self' https://storage.googleapis.com https://apis.google.com https://docs.google.com https://code.jquery.com 'unsafe-inline'; connect-src 'self' https://*.dropboxapi.com https://api.trello.com https://api.github.com https://raw.githubusercontent.com https://*.googleapis.com https://*.googleusercontent.com https://graph.microsoft.com https://*.1drv.com https://*.sharepoint.com https://gitlab.com https://*.google.com https://fonts.gstatic.com https://fonts.googleapis.com; img-src * data:; media-src * data:; font-src * about:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; frame-src 'self' https://*.google.com;");
    s.setAttribute("http-equiv", "Content-Security-Policy");
    var t = document.getElementsByTagName("meta")[0];
    t.parentNode.insertBefore(s, t);
  } catch (e) {}
})();

window.EXPORT_URL = "/service/0";
window.DRAWIO_BASE_URL = window.location.origin;
window.DRAWIO_SERVER_URL = window.location.origin + "/";
window.DRAWIO_VIEWER_URL = "";
window.DRAWIO_LIGHTBOX_URL = "";
window.DRAW_MATH_URL = "math4/es5";

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
