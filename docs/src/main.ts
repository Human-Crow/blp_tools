// cd blp_tools; if ($?) { npx tsc --watch }
// git rm -r --cached .

import { init_tabs } from './ui/tabs.js';
import { init_mirror } from './ui/mirror.js';
import { init_tier } from './ui/tier.js';
import { init_image } from './ui/image.js';


init_tabs();
init_mirror();
init_tier();
init_image();
