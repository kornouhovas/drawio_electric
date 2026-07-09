const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/main/webapp/js/diagramly/App.js');
const bootstrap = read('src/main/webapp/js/bootstrap.js');
const electric = read('src/main/webapp/js/diagramly/Electric.js');
const editorUi = read('src/main/webapp/js/diagramly/EditorUi.js');
const menus = read('src/main/webapp/js/diagramly/Menus.js');
const preConfig = read('deploy/PreConfig.js');
const dockerfile = read('deploy/Dockerfile');
const caddy = read('deploy/Caddyfile.draw-electric-dev');
const deployScript = read('deploy/deploy.sh');
const quicSysctl = read('deploy/99-caddy-quic.conf');

assert(app.includes("Editor.isElectricTheme() ?\n\t\t\t\t\t\t['js/shapes-14-6-5.min.js']"),
	'Electric startup must only block on the shape definitions bundle');
assert(app.includes("['js/shapes-14-6-5.min.js', 'js/stencils.min.js',"),
	'Standard themes must keep the upstream startup bundle set');
assert(app.includes('App.getAssetUrl(scripts[i])'),
	'Dynamically loaded application scripts must use versioned URLs');
assert(editorUi.includes("App.getAssetUrl(window.DRAWIO_SERVER_URL + 'js/extensions.min.js')"),
	'Lazy import and export extensions must use versioned URLs');
assert(bootstrap.includes("window.DRAWIO_ASSET_URL('js/app.min.js')"),
	'The main application bundle must use a versioned URL');
assert(preConfig.includes('window.ELECTRIC_LAZY_MATH = true'),
	'Electric must defer MathJax when math was not explicitly requested');
assert(electric.includes('Editor.ensureElectricMath'),
	'Electric must restore MathJax when a math diagram or command needs it');
assert(menus.includes("typeof(MathJax) !== 'undefined' || window.ELECTRIC_LAZY_MATH"),
	'The math command must remain available before lazy MathJax loads');
assert.equal((menus.match(
	/typeof\(MathJax\) !== 'undefined' \|\| window\.ELECTRIC_LAZY_MATH/g) || []).length,
	2, 'Electric must expose both the MathJax action and menu item before loading');
assert(dockerfile.includes('<param-name>precompressed</param-name>'),
	'Tomcat must serve precompressed static assets');
assert(dockerfile.includes('-exec gzip -9 -k -f {} +'),
	'The production image must contain precompressed assets');
assert(caddy.includes('@versionedApplicationAssets'),
	'Versioned application assets must receive immutable caching');
assert(quicSysctl.includes('net.core.rmem_max = 7500000') &&
	quicSysctl.includes('net.core.wmem_max = 7500000'),
	'Caddy must have enough UDP buffer space for HTTP/3 transfers');
assert(deployScript.includes('sysctl -p /etc/sysctl.d/99-caddy-quic.conf'),
	'The production deploy must apply the versioned QUIC buffer configuration');
