window.EXPORT_URL = "/service/0";
window.DRAWIO_BASE_URL = window.location.origin;
window.DRAWIO_SERVER_URL = window.location.origin + "/";
window.DRAWIO_VIEWER_URL = "";
window.DRAWIO_LIGHTBOX_URL = "";
window.DRAW_MATH_URL = "math4/es5";
window.DRAWIO_ASSET_VERSION = "@DRAWIO_ASSET_VERSION@";
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

// Start the native editor in local-file mode; keep its theme and library controls.
urlParams["local"] = "1";
urlParams["splash"] = "0";

urlParams["sync"] = "manual";
urlParams["db"] = "0";
urlParams["gh"] = "0";
urlParams["tr"] = "0";
urlParams["gapi"] = "0";
urlParams["od"] = "0";
urlParams["gl"] = "0";
